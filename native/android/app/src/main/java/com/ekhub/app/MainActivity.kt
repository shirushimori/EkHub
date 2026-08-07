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
import android.widget.HorizontalScrollView
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/**
 * WebView shell around the EkHub web app with a browser-style tab system.
 *
 * - Each tab owns its own [WebView] and tab chip; the active tab's WebView is
 *   the one attached to the view hierarchy.
 * - Home / Back / Forward toolbar controls the active tab.
 * - Links that leave the app host open in the external browser.
 */
class MainActivity : Activity() {

    private val homeUrl = "https://ekhub.vercel.app/app"
    private val appHost = "ekhub.vercel.app"

    private class Tab(val webView: WebView, val chip: View, val titleView: TextView)

    private val tabs = ArrayList<Tab>()
    private var activeIndex = -1

    private lateinit var webContainer: FrameLayout
    private lateinit var tabContainer: LinearLayout
    private lateinit var tabScroll: HorizontalScrollView
    private lateinit var progress: ProgressBar
    private lateinit var btnHome: ImageButton
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webContainer = findViewById(R.id.web_container)
        tabContainer = findViewById(R.id.tab_container)
        tabScroll = findViewById(R.id.tab_scroll)
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
        findViewById<View>(R.id.btn_new_tab).setOnClickListener { addTab(homeUrl) }

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
        val chip = layoutInflater.inflate(R.layout.view_tab_chip, tabContainer, false)
        val titleView = chip.findViewById<TextView>(R.id.tab_title)
        titleView.text = getString(R.string.app_name)

        chip.setOnClickListener { selectTab(index) }
        chip.findViewById<View>(R.id.tab_close).setOnClickListener { closeTab(index) }

        tabs.add(Tab(webView, chip, titleView))
        tabContainer.addView(chip)
        selectTab(index)
        webView.loadUrl(url)
        tabScroll.post { tabScroll.fullScroll(View.FOCUS_RIGHT) }
    }

    private fun selectTab(index: Int) {
        if (index !in tabs.indices) return
        val prev = activeTab()
        if (prev != null && prev.webView.parent != null) {
            webContainer.removeView(prev.webView)
        }
        activeIndex = index
        webContainer.addView(tabs[index].webView)
        updateChips()
        updateToolbar()
    }

    private fun closeTab(index: Int) {
        if (tabs.size <= 1 || index !in tabs.indices) return
        val closingActive = index == activeIndex
        val oldActive = activeIndex
        val tab = tabs.removeAt(index)
        tabContainer.removeView(tab.chip)
        webContainer.removeView(tab.webView)
        runCatching { tab.webView.destroy() }

        if (closingActive) {
            activeIndex = -1
            selectTab(if (index >= tabs.size) tabs.size - 1 else index)
        } else {
            if (index < oldActive) activeIndex -= 1
            updateChips()
            updateToolbar()
        }
    }

    private fun updateChips() {
        for (i in tabs.indices) tabs[i].chip.isSelected = (i == activeIndex)
    }

    private fun indexOfWebView(wv: WebView): Int =
        tabs.indexOfFirst { it.webView === wv }

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
                return handleUrl(request.url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                return handleUrl(Uri.parse(url))
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                progress.visibility = View.VISIBLE
                val i = indexOfWebView(view)
                if (i >= 0) tabs[i].titleView.text = Uri.parse(url).host ?: getString(R.string.app_name)
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

            override fun onReceivedTitle(view: WebView, title: String?) {
                val i = indexOfWebView(view)
                if (i >= 0 && !title.isNullOrBlank()) tabs[i].titleView.text = title
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

    // ── navigation ────────────────────────────────────────────────────────

    private fun isAppUrl(uri: Uri): Boolean =
        uri.scheme?.lowercase() == "https" && uri.host?.lowercase() == appHost

    /** return true = navigation is handled here (external browser / blocked). */
    private fun handleUrl(uri: Uri): Boolean {
        if (isAppUrl(uri)) return false
        if (uri.scheme?.lowercase() == "http" || uri.scheme?.lowercase() == "https") {
            openExternal(uri)
        }
        return true
    }

    /** target=_blank / window.open: app pages open in a new tab, others go to the browser. */
    private fun handleNewWindow(resultMsg: Message): Boolean {
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
        val dummy = WebView(this)
        dummy.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (isAppUrl(uri)) {
                    addTab(uri.toString())
                    return true
                }
                openExternal(uri)
                return true
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val uri = Uri.parse(url)
                if (isAppUrl(uri)) {
                    addTab(uri.toString())
                    return true
                }
                openExternal(uri)
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
