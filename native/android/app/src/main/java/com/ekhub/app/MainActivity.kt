package com.ekhub.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
import java.net.HttpURLConnection
import java.net.URL

/**
 * Whitelist-driven WebView shell around the EkHub web app.
 *
 * - Only hosts listed in whitelist.txt load inside the app. The whitelist is
 *   served from GitHub raw, cached locally, and falls back to a bundled copy.
 * - Links to whitelisted hosts open in a new tab (no tab UI: back / Home
 *   navigate; closing the top tab lands on the previous one).
 * - Everything not whitelisted goes to the external browser.
 * - Home / Back / Forward toolbar controls the active tab.
 */
class MainActivity : Activity() {

    private val homeUrl = "https://ekhub.vercel.app/app"
    private val appHost = "ekhub.vercel.app"
    private val whitelistUrl = "https://raw.githubusercontent.com/shirushimori/EkHub/main/whitelist.txt"

    private val defaultWhitelist = """
        ekhub.vercel.app
        hdhub4u
        4khdhub
        hubcloud
        hubdrive
        gamerxyt
        hubstream.art
        greenmountmotors.com
        hdstream4u
        player.videasy.net
        player.autoembed.cc
        image.tmdb.org
    """.trimIndent()

    private class Tab(val webView: WebView)

    private val tabs = ArrayList<Tab>()
    private var activeIndex = -1
    private val whitelist = HashSet<String>()

    private lateinit var webContainer: FrameLayout
    private lateinit var progress: ProgressBar
    private lateinit var btnHome: ImageButton
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webContainer = findViewById(R.id.web_container)
        progress = findViewById(R.id.progress)
        btnHome = findViewById(R.id.btn_home)
        btnBack = findViewById(R.id.btn_back)
        btnForward = findViewById(R.id.btn_forward)

        btnHome.setOnClickListener { activeTab()?.webView?.loadUrl(homeUrl) }
        btnBack.setOnClickListener {
            val wv = activeTab()?.webView ?: return@setOnClickListener
            if (wv.canGoBack()) wv.goBack()
        }
        btnForward.setOnClickListener {
            val wv = activeTab()?.webView ?: return@setOnClickListener
            if (wv.canGoForward()) wv.goForward()
        }

        loadWhitelist()
        addTab(homeUrl)
    }

    override fun onDestroy() {
        for (tab in tabs) runCatching { tab.webView.destroy() }
        tabs.clear()
        super.onDestroy()
    }

    // ── tabs ──────────────────────────────────────────────────────────────

    private fun activeTab(): Tab? = tabs.getOrNull(activeIndex)

    private fun addTab(url: String) {
        val index = tabs.size
        val webView = createWebView()
        tabs.add(Tab(webView))
        selectTab(index)
        webView.loadUrl(url)
    }

    private fun selectTab(index: Int) {
        if (index !in tabs.indices) return
        val prev = activeTab()
        if (prev != null && prev.webView.parent != null) {
            webContainer.removeView(prev.webView)
        }
        activeIndex = index
        webContainer.addView(tabs[index].webView)
        updateToolbar()
    }

    private fun closeTab(index: Int) {
        if (tabs.size <= 1 || index !in tabs.indices) return
        val closingActive = index == activeIndex
        val oldActive = activeIndex
        val tab = tabs.removeAt(index)
        webContainer.removeView(tab.webView)
        runCatching { tab.webView.destroy() }

        if (closingActive) {
            activeIndex = -1
            selectTab(if (index >= tabs.size) tabs.size - 1 else index)
        } else {
            if (index < oldActive) activeIndex -= 1
            updateToolbar()
        }
    }

    // ── WebView creation ──────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        val wv = WebView(this)
        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            javaScriptCanOpenWindowsAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            loadWithOverviewMode = true
            useWideViewPort = true
            userAgentString = userAgentString.replace("; wv", "")
        }

        wv.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (!isAllowed(uri)) {
                    if (request.isForMainFrame) openExternal(uri)
                    return true
                }
                if (!request.isForMainFrame) return false
                val currentHost = view.url?.let { Uri.parse(it).host?.lowercase() }
                if (currentHost != null && uri.host?.lowercase() != currentHost) {
                    addTab(uri.toString())
                    return true
                }
                return false
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val uri = Uri.parse(url)
                if (!isAllowed(uri)) {
                    openExternal(uri)
                    return true
                }
                val currentHost = view.url?.let { Uri.parse(it).host?.lowercase() }
                if (currentHost != null && uri.host?.lowercase() != currentHost) {
                    addTab(uri.toString())
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                progress.visibility = View.VISIBLE
                updateToolbar()
            }

            override fun onPageFinished(view: WebView, url: String?) {
                progress.visibility = View.GONE
                updateToolbar()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) progress.visibility = View.GONE
            }
        }

        wv.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
            }

            override fun onCreateWindow(
                view: WebView,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message
            ): Boolean {
                return handleNewWindow(resultMsg)
            }
        }

        return wv
    }

    // ── whitelist ─────────────────────────────────────────────────────────

    private fun loadWhitelist() {
        val cached = getSharedPreferences("ekhub", MODE_PRIVATE).getString("whitelist", null)
        setWhitelist(cached ?: defaultWhitelist)
        refreshWhitelist()
    }

    private fun refreshWhitelist() {
        Thread {
            runCatching {
                val conn = URL(whitelistUrl).openConnection() as HttpURLConnection
                conn.connectTimeout = 10_000
                conn.readTimeout = 10_000
                val text = conn.inputStream.bufferedReader().readText()
                conn.disconnect()
                if (parseWhitelist(text).isNotEmpty()) {
                    getSharedPreferences("ekhub", MODE_PRIVATE)
                        .edit().putString("whitelist", text).apply()
                    runOnUiThread { setWhitelist(text) }
                }
            }
        }.start()
    }

    private fun setWhitelist(text: String) {
        whitelist.clear()
        whitelist.addAll(parseWhitelist(text))
        whitelist.add(appHost)
    }

    private fun parseWhitelist(text: String): List<String> =
        text.lines().map { it.trim().lowercase() }
            .filter { it.isNotEmpty() && !it.startsWith("#") }

    // ── navigation ────────────────────────────────────────────────────────

    private fun isAllowed(uri: Uri): Boolean {
        if (uri.scheme?.lowercase() != "http" && uri.scheme?.lowercase() != "https") return false
        val host = uri.host?.lowercase() ?: return false
        return whitelist.any { host.contains(it) }
    }

    /** target=_blank / window.open: whitelisted opens a new tab, else browser. */
    private fun handleNewWindow(resultMsg: Message): Boolean {
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
        val dummy = WebView(this)
        dummy.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (isAllowed(uri)) addTab(uri.toString()) else openExternal(uri)
                return true
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val uri = Uri.parse(url)
                if (isAllowed(uri)) addTab(uri.toString()) else openExternal(uri)
                return true
            }
        }
        transport.webView = dummy
        resultMsg.sendToTarget()
        return true
    }

    private fun openExternal(uri: Uri) {
        runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
    }

    private fun updateToolbar() {
        val wv = activeTab()?.webView
        val canBack = wv?.canGoBack() == true
        val canForward = wv?.canGoForward() == true
        btnBack.isEnabled = canBack
        btnBack.alpha = if (canBack) 1f else 0.3f
        btnForward.isEnabled = canForward
        btnForward.alpha = if (canForward) 1f else 0.3f
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val wv = activeTab()?.webView
        when {
            wv?.canGoBack() == true -> wv.goBack()
            tabs.size > 1 -> closeTab(activeIndex)
            else -> super.onBackPressed()
        }
    }
}
