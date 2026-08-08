package com.ekhub.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.PendingIntent
import android.app.ProgressDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.provider.Settings
import android.view.View
import android.view.ViewGroup
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
import android.widget.LinearLayout
import android.widget.ProgressBar
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
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
 * - A popout button opens the current page in the default browser; it shows
 *   only when the active tab is on a non-EkHub, non-4khub4u host.
 * - Home / Back / Forward toolbar controls the active tab.
 */
class MainActivity : Activity() {

    private val homeUrl = "https://ekhub.vercel.app/app"
    private val appHost = "ekhub.vercel.app"
    private val whitelistUrl = "https://raw.githubusercontent.com/shirushimori/EkHub/main/whitelist.txt"
    private val updateFeedUrl = "https://api.github.com/repos/shirushimori/EkHub/releases/latest"
    private val apkFileName = "ekhub-update.apk"
    private val INSTALL_RESULT_ACTION = "com.ekhub.app.INSTALL_RESULT"

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
    private lateinit var toolbar: LinearLayout
    private lateinit var btnHome: ImageButton
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton
    private lateinit var btnReload: ImageButton
    private lateinit var btnPopout: ImageButton

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webContainer = findViewById(R.id.web_container)
        progress = findViewById(R.id.progress)
        toolbar = findViewById(R.id.toolbar)
        btnHome = findViewById(R.id.btn_home)
        btnBack = findViewById(R.id.btn_back)
        btnForward = findViewById(R.id.btn_forward)
        btnReload = findViewById(R.id.btn_reload)
        btnPopout = findViewById(R.id.btn_popout)

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
        btnPopout.setOnClickListener {
            openCurrentPageInBrowser()
        }

        loadWhitelist()
        AdBlocker.loadBundled(this)
        AdBlocker.refresh(this)
        registerInstallReceiver()
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

    override fun onPause() {
        super.onPause()
        if (isCustomViewShowing()) hideCustomView()
    }

    override fun onDestroy() {
        if (isCustomViewShowing()) hideCustomView()
        for (tab in tabs) runCatching { tab.webView.destroy() }
        tabs.clear()
        runCatching { unregisterReceiver(installReceiver) }
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

            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                showCustomView(view, callback)
            }

            override fun onHideCustomView() {
                hideCustomView()
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

    // ── fullscreen (custom view) ─────────────────────────────────────────

    private fun isCustomViewShowing(): Boolean = customView != null

    /** Called when the page requests fullscreen (e.g. the player popup button). */
    private fun showCustomView(view: View, callback: WebChromeClient.CustomViewCallback) {
        if (isCustomViewShowing()) {
            callback.onCustomViewHidden()
            return
        }
        customView = view
        customViewCallback = callback
        activeTab()?.webView?.let { wv ->
            if (wv.parent != null) webContainer.removeView(wv)
        }
        (view.parent as? ViewGroup)?.removeView(view)
        webContainer.addView(
            view,
            FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        )
        toolbar.visibility = View.GONE
        progress.visibility = View.GONE
        hideSystemUI()
    }

    private fun hideCustomView() {
        val view = customView ?: return
        customView = null
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null
        webContainer.removeView(view)
        toolbar.visibility = View.VISIBLE
        showSystemUI()
        activeTab()?.webView?.let { wv ->
            if (wv.parent == null) {
                webContainer.addView(wv, 0)
                wv.requestFocus()
            }
        }
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )
    }

    private fun showSystemUI() {
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
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
                downloadApk(apkUrl)
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

    /**
     * Downloads the update APK and validates it before handing it to the
     * installer. A previous bug downloaded whatever the server returned without
     * checks, so a redirect HTML page or truncated body was handed to the
     * package installer → "App not installed as package appears to be invalid".
     */
    private fun downloadApk(apkUrl: String): File {
        val dir = getExternalFilesDir(null) ?: filesDir
        val apkFile = File(dir, apkFileName)
        val conn = URL(apkUrl).openConnection() as HttpURLConnection
        try {
            conn.instanceFollowRedirects = true
            conn.connectTimeout = 15_000
            conn.readTimeout = 30_000
            val status = conn.responseCode
            if (status !in 200..299) {
                throw IOException("Server returned HTTP $status")
            }

            val input = conn.inputStream
            val output = FileOutputStream(apkFile)
            input.use { i -> output.use { o -> i.copyTo(o) } }

            val contentLength = conn.contentLength
            if (contentLength > 0 && apkFile.length() != contentLength.toLong()) {
                throw IOException("Download incomplete (${apkFile.length()} of $contentLength bytes)")
            }
        } finally {
            conn.disconnect()
        }

        // Validate it's a real APK (ZIP magic: "PK\x03\x04") — cheap guard
        // against error pages / HTML being saved with a .apk name.
        val magic = apkFile.inputStream().use { i ->
            val b = ByteArray(4)
            val n = i.read(b)
            n == 4 && b[0] == 'P'.code.toByte() && b[1] == 'K'.code.toByte() && b[2] == 3.toByte() && b[3] == 4.toByte()
        }
        if (!magic || apkFile.length() == 0L) {
            apkFile.delete()
            throw IOException("Downloaded file is not a valid APK")
        }

        return apkFile
    }

    private fun installApk(apkFile: File) {
        val installer = packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        try {
            val sessionId = installer.createSession(params)
            val session = installer.openSession(sessionId)
            session.openWrite("package", 0, -1).use { out ->
                apkFile.inputStream().use { input -> input.copyTo(out) }
            }
            val callbackIntent = PendingIntent.getBroadcast(
                this,
                sessionId,
                Intent(INSTALL_RESULT_ACTION).setPackage(packageName),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            session.commit(callbackIntent.intentSender)
            session.close()
        } catch (e: Exception) {
            AlertDialog.Builder(this)
                .setTitle("Update failed")
                .setMessage(e.message ?: "Could not start the installation.")
                .setPositiveButton("OK", null)
                .show()
        }
    }

    private fun registerInstallReceiver() {
        registerReceiver(
            installReceiver,
            IntentFilter(INSTALL_RESULT_ACTION),
            Context.RECEIVER_NOT_EXPORTED
        )
    }

    private val installReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
            val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)
            val title = when (status) {
                PackageInstaller.STATUS_SUCCESS -> "Update installed"
                PackageInstaller.STATUS_PENDING_USER_ACTION -> "Update"
                else -> "Update failed"
            }
            val text = when (status) {
                PackageInstaller.STATUS_SUCCESS -> "EkHub updated successfully."
                PackageInstaller.STATUS_PENDING_USER_ACTION -> "Follow the on-screen prompt to finish the update."
                else -> message ?: "The update could not be installed."
            }
            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle(title)
                    .setMessage(text)
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }

    // ── navigation ────────────────────────────────────────────────────────

    private fun isAllowed(uri: Uri): Boolean {
        if (uri.scheme?.lowercase() != "http" && uri.scheme?.lowercase() != "https") return false
        val host = uri.host?.lowercase() ?: return false
        return whitelist.any { host.contains(it) }
    }

    /**
     * Popout: opens the current page in the default external browser. The
     * button only shows when the active tab is NOT on EkHub itself and NOT on
     * the 4k hub streaming sites (hdhub4u / 4khdhub) — i.e. when the user is
     * on a third-party host (hubcloud, player, etc.) and might want to leave.
     */
    private fun openCurrentPageInBrowser() {
        val url = activeTab()?.webView?.url ?: return
        runCatching {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        }
    }

    private fun shouldShowPopout(host: String?): Boolean {
        val h = host?.lowercase() ?: return false
        if (h.contains(appHost)) return false
        if (h.contains("hdhub4u") || h.contains("4khdhub")) return false
        return true
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

        val host = wv?.url?.let { Uri.parse(it).host }
        btnPopout.visibility = if (shouldShowPopout(host)) View.VISIBLE else View.GONE
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (isCustomViewShowing()) {
            hideCustomView()
            return
        }
        val wv = activeTab()?.webView
        when {
            wv?.canGoBack() == true -> wv.goBack()
            tabs.size > 1 -> closeTab(activeIndex)
            else -> super.onBackPressed()
        }
    }
}
