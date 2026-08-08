package com.ekhub.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.ProgressDialog
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.provider.Settings
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/**
 * Whitelist-driven WebView shell around the EkHub web app.
 *
 * - Only hosts listed in whitelist.txt load inside the app. The whitelist is
 *   served from GitHub raw, cached locally, and falls back to a bundled copy.
 * - Links to whitelisted hosts open in a new tab (no tab UI: back / Home
 *   navigate; closing the top tab lands on the previous one).
 * - Everything not whitelisted is blocked — it never opens in the app and
 *   never opens in the external browser.
 * - Download links from the web app are handed off to the default external
 *   browser via the EkHubNative bridge.
 * - Home / Back / Forward toolbar controls the active tab.
 */
class MainActivity : Activity() {

    private val homeUrl = "https://ekhub.vercel.app/app"
    private val appHost = "ekhub.vercel.app"
    private val whitelistUrl = "https://raw.githubusercontent.com/shirushimori/EkHub/main/whitelist.txt"
    private val updateFeedUrl = "https://api.github.com/repos/shirushimori/EkHub/releases/latest"
    private val apkFileName = "ekhub-update.apk"

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
    private lateinit var btnReload: ImageButton

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webContainer = findViewById(R.id.web_container)
        progress = findViewById(R.id.progress)
        btnHome = findViewById(R.id.btn_home)
        btnBack = findViewById(R.id.btn_back)
        btnForward = findViewById(R.id.btn_forward)
        btnReload = findViewById(R.id.btn_reload)

        btnHome.setOnClickListener { activeTab()?.webView?.loadUrl(homeUrl) }
        btnBack.setOnClickListener {
            val wv = activeTab()?.webView ?: return@setOnClickListener
            if (wv.canGoBack()) wv.goBack()
        }
        btnForward.setOnClickListener {
            val wv = activeTab()?.webView ?: return@setOnClickListener
            if (wv.canGoForward()) wv.goForward()
        }
        btnReload.setOnClickListener {
            activeTab()?.webView?.reload()
        }

        loadWhitelist()
        AdBlocker.loadBundled(this)
        AdBlocker.refresh(this)
        addTab(homeUrl)
        checkForUpdate()

        val openUrl = intent?.getStringExtra("open_url")
        if (openUrl != null && isAllowed(Uri.parse(openUrl))) {
            addTab(openUrl)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val openUrl = intent.getStringExtra("open_url")
        if (openUrl != null && isAllowed(Uri.parse(openUrl))) {
            addTab(openUrl)
        }
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
                if (!isAllowed(uri)) return true
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
                if (!isAllowed(uri)) return true
                val currentHost = view.url?.let { Uri.parse(it).host?.lowercase() }
                if (currentHost != null && uri.host?.lowercase() != currentHost) {
                    addTab(uri.toString())
                    return true
                }
                return false
            }

            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                return if (AdBlocker.isBlocked(request.url)) AdBlocker.emptyResponse() else null
            }

            @Deprecated("Deprecated in Java")
            override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? {
                val uri = Uri.parse(url)
                return if (AdBlocker.isBlocked(uri)) AdBlocker.emptyResponse() else null
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

        wv.addJavascriptInterface(EkHubNativeBridge(), "EkHubNative")

        return wv
    }

    // ── native bridge ────────────────────────────────────────────────────

    /** Receives download context from the web app and opens the link in the
     *  default external browser (the in-app download prototype is disabled). */
    private inner class EkHubNativeBridge {
        @JavascriptInterface
        fun setDownloadContext(json: String) {
            runCatching {
                val o = JSONObject(json)
                val url = o.optString("url", "")
                if (url.isNotEmpty()) {
                    runOnUiThread {
                        runCatching {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            startActivity(intent)
                        }
                    }
                }
            }
        }
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

    // ── update check ───────────────────────────────────────────────────────

    private fun checkForUpdate() {
        Thread {
            runCatching {
                val conn = URL(updateFeedUrl).openConnection() as HttpURLConnection
                conn.connectTimeout = 10_000
                conn.readTimeout = 10_000
                conn.setRequestProperty("Accept", "application/vnd.github+json")
                val body = conn.inputStream.bufferedReader().readText()
                conn.disconnect()

                val json = JSONObject(body)
                val tag = json.optString("tag_name", "")
                val notes = json.optString("body", "").trim()
                val assets = json.optJSONArray("assets")
                var apkUrl = ""
                if (assets != null) {
                    // Prefer the release's EkHub.apk asset — the locally-built
                    // APK signed with the app's stable key. CI also uploads an
                    // app-release.apk built with a fresh keystore each run, which
                    // would fail to install over the existing app (signature
                    // mismatch / "package conflicts").
                    for (i in 0 until assets.length()) {
                        val a = assets.getJSONObject(i)
                        if (a.optString("name") == "EkHub.apk") {
                            apkUrl = a.optString("browser_download_url", "")
                            break
                        }
                    }
                    if (apkUrl.isEmpty()) {
                        for (i in 0 until assets.length()) {
                            val a = assets.getJSONObject(i)
                            if (a.optString("name").endsWith(".apk")) {
                                apkUrl = a.optString("browser_download_url", "")
                                break
                            }
                        }
                    }
                }
                if (apkUrl.isEmpty() || tag.isEmpty()) return@runCatching

                val current = runCatching {
                    packageManager.getPackageInfo(packageName, 0).versionName ?: "0"
                }.getOrDefault("0")

                if (isNewer(parseVersion(tag), parseVersion(current))) {
                    runOnUiThread { showUpdateDialog(tag, notes, apkUrl) }
                }
            }
        }.start()
    }

    private fun parseVersion(v: String): IntArray =
        v.trim().trimStart('v', 'V').split('.').mapNotNull { it.toIntOrNull() }.toIntArray()

    private fun isNewer(remote: IntArray, current: IntArray): Boolean {
        val len = maxOf(remote.size, current.size)
        for (i in 0 until len) {
            val r = remote.getOrElse(i) { 0 }
            val c = current.getOrElse(i) { 0 }
            if (r != c) return r > c
        }
        return false
    }

    private fun showUpdateDialog(version: String, notes: String, apkUrl: String) {
        AlertDialog.Builder(this)
            .setTitle("Update available: $version")
            .setMessage(
                "A new version of EkHub is ready to install." +
                    (if (notes.isNotEmpty()) "\n\n$notes" else "")
            )
            .setPositiveButton("Update") { _, _ -> startUpdate(apkUrl) }
            .setNegativeButton("Later", null)
            .show()
    }

    private fun startUpdate(apkUrl: String) {
        if (!packageManager.canRequestPackageInstalls()) {
            AlertDialog.Builder(this)
                .setTitle("Allow installs")
                .setMessage("To install the update, allow EkHub to install apps from this source.")
                .setPositiveButton("Allow") { _, _ ->
                    runCatching {
                        startActivity(
                            Intent(
                                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:$packageName")
                            )
                        )
                    }
                }
                .setNegativeButton("Cancel", null)
                .show()
            return
        }
        downloadAndInstall(apkUrl)
    }

    private fun downloadAndInstall(apkUrl: String) {
        val progressDialog = ProgressDialog(this).apply {
            setTitle("Downloading update")
            setMessage("Downloading the latest EkHub APK\u2026")
            setIndeterminate(true)
            setCancelable(false)
        }
        progressDialog.show()

        Thread {
            runCatching {
                val dir = getExternalFilesDir(null) ?: filesDir
                val apkFile = File(dir, apkFileName)
                val conn = URL(apkUrl).openConnection() as HttpURLConnection
                conn.connectTimeout = 15_000
                conn.readTimeout = 30_000
                conn.inputStream.use { input ->
                    FileOutputStream(apkFile).use { output -> input.copyTo(output) }
                }
                conn.disconnect()
                apkFile
            }.onSuccess { apkFile ->
                runOnUiThread {
                    progressDialog.dismiss()
                    installApk(apkFile)
                }
            }.onFailure { e ->
                runOnUiThread {
                    progressDialog.dismiss()
                    AlertDialog.Builder(this)
                        .setTitle("Update failed")
                        .setMessage(e.message ?: "Could not download the update.")
                        .setPositiveButton("OK", null)
                        .show()
                }
            }
        }.start()
    }

    private fun installApk(apkFile: File) {
        val uri = Uri.Builder()
            .scheme("content")
            .authority("$packageName.apkprovider")
            .appendPath(apkFile.name)
            .build()
        val intent = Intent(Intent.ACTION_VIEW)
        intent.setDataAndType(uri, "application/vnd.android.package-archive")
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        runCatching { startActivity(intent) }
    }

    // ── navigation ────────────────────────────────────────────────────────

    private fun isAllowed(uri: Uri): Boolean {
        if (uri.scheme?.lowercase() != "http" && uri.scheme?.lowercase() != "https") return false
        val host = uri.host?.lowercase() ?: return false
        return whitelist.any { host.contains(it) }
    }

    /** target=_blank / window.open: whitelisted opens a new tab, else blocked. */
    private fun handleNewWindow(resultMsg: Message): Boolean {
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
        val dummy = WebView(this)
        dummy.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (isAllowed(uri)) addTab(uri.toString())
                return true
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val uri = Uri.parse(url)
                if (isAllowed(uri)) addTab(uri.toString())
                return true
            }
        }
        transport.webView = dummy
        resultMsg.sendToTarget()
        return true
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
