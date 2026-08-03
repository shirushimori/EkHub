package com.ekhub.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.view.View
import android.webkit.DownloadListener
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.TextView
import org.json.JSONObject

/**
 * Thin WebView shell around the EkHub web app.
 *
 * - Stays on dotrent.vercel.app.
 * - Watch players and download mirrors load in-app so the whole flow works
 *   without leaving the app; ad/tracker popups and new-tab ad windows are
 *   blocked (native + injected JS).
 * - Downloads are intercepted and saved into an organized, app-private folder
 *   tree (Movies/<Title>/, Series/<Title>/Season <n>/), driven by metadata the
 *   web app sends over the EkHubNative JS bridge.
 * - A Crunchyroll-style "Download complete" banner slides up when a download
 *   finishes, with a button that opens the built-in video player.
 */
class MainActivity : Activity() {

    private val homeUrl = "https://dotrent.vercel.app"
    private val appHost = "dotrent.vercel.app"

    private lateinit var webView: WebView
    private lateinit var repo: DownloadRepository

    private var pendingContext: DownloadContext? = null
    private var downloadReceiver: BroadcastReceiver? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private val hideBanner = Runnable { setBannerVisible(false) }
    private var lastDownloadPath: String? = null
    private var lastDownloadTitle: String = ""

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        repo = DownloadRepository(this)
        repo.listener = { info -> mainHandler.post { showDownloadBanner(info) } }

        downloadReceiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                if (intent?.action == DownloadManager.ACTION_DOWNLOAD_COMPLETE) {
                    repo.onDownloadComplete(intent)
                }
            }
        }
        registerReceiver(downloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))

        webView.addJavascriptInterface(Bridge(), "EkHubNative")

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setSupportZoom(false)
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.userAgentString = settings.userAgentString.replace("; wv", "")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return shouldIntercept(request.url.toString())
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                return shouldIntercept(url)
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                findViewById<ProgressBar>(R.id.progress).visibility = View.VISIBLE
                injectAdBlock()
            }

            override fun onPageFinished(view: WebView, url: String?) {
                findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
                injectAdBlock()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                findViewById<ProgressBar>(R.id.progress).progress = newProgress
            }

            override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
                return handleNewWindow(resultMsg)
            }
        }

        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            val ctx = pendingContext
            pendingContext = null
            repo.enqueue(url, userAgent, mimeType, contentDisposition, ctx)
        })

        findViewById<View>(R.id.banner_close).setOnClickListener { setBannerVisible(false) }
        findViewById<View>(R.id.banner_play).setOnClickListener {
            val path = lastDownloadPath ?: return@setOnClickListener
            startActivity(
                Intent(this, PlayerActivity::class.java)
                    .putExtra("path", path)
                    .putExtra("title", lastDownloadTitle)
            )
        }

        webView.loadUrl(homeUrl)
    }

    override fun onDestroy() {
        downloadReceiver?.let { runCatching { unregisterReceiver(it) } }
        super.onDestroy()
    }

    // ── navigation / popup filtering ─────────────────────────────────────

    /** return true = swallow the navigation. */
    private fun shouldIntercept(url: String): Boolean {
        if (AdBlocker.isAd(url)) return true
        return handleNavigation(url)
    }

    private fun handleNavigation(url: String): Boolean {
        val uri = Uri.parse(url)
        val host = uri.host ?: return false
        if (host == appHost || host.endsWith(".vercel.app")) return false

        val scheme = uri.scheme?.lowercase()
        if (scheme != "http" && scheme != "https") {
            runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
            return true
        }

        // Everything else loads in-app: watch players and download-mirror
        // procedures keep working, and ads get filtered before they spawn.
        return false
    }

    /** target=_blank / window.open: block ad popups, route everything else into the main WebView. */
    private fun handleNewWindow(resultMsg: Message): Boolean {
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
        val dummy = WebView(this)
        dummy.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                if (AdBlocker.isAd(url)) return true
                webView.loadUrl(url)
                return true
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                if (AdBlocker.isAd(url)) return true
                webView.loadUrl(url)
                return true
            }
        }
        transport.webView = dummy
        resultMsg.sendToTarget()
        return true
    }

    private fun injectAdBlock() {
        webView.evaluateJavascript(AdBlocker.AD_BLOCK_JS, null)
    }

    // ── download banner ──────────────────────────────────────────────────

    private fun showDownloadBanner(info: CompletedDownload) {
        lastDownloadTitle = info.title
        lastDownloadPath = info.absolutePath(this)
        findViewById<TextView>(R.id.banner_text).text = info.title
        findViewById<View>(R.id.banner_play).visibility = if (info.isVideo) View.VISIBLE else View.GONE
        setBannerVisible(true)
    }

    private fun setBannerVisible(visible: Boolean) {
        val banner = findViewById<View>(R.id.banner_download)
        mainHandler.removeCallbacks(hideBanner)
        if (visible) {
            banner.alpha = 0f
            banner.visibility = View.VISIBLE
            banner.animate().alpha(1f).setDuration(220).start()
            mainHandler.postDelayed(hideBanner, 6000)
        } else {
            banner.animate()
                .alpha(0f)
                .setDuration(180)
                .withEndAction { banner.visibility = View.GONE }
                .start()
        }
    }

    // ── JS bridge from the web app ───────────────────────────────────────

    private inner class Bridge {
        @JavascriptInterface
        fun setDownloadContext(json: String) {
            val ctx = runCatching {
                val o = JSONObject(json)
                DownloadContext(
                    title = o.optString("title"),
                    type = o.optString("type", "movie"),
                    season = o.optString("season").ifEmpty { null },
                    episode = o.optString("episode").ifEmpty { null },
                    fileName = o.optString("fileName").ifEmpty { null },
                )
            }.getOrNull()
            mainHandler.post { pendingContext = ctx }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
