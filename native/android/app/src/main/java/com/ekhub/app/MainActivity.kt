package com.ekhub.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar

/**
 * Minimal WebView shell around the EkHub web app.
 *
 * - Loads the hosted app at [homeUrl].
 * - Links that leave the app host open in the external browser.
 * - The system back button navigates back within the WebView.
 */
class MainActivity : Activity() {

    private val homeUrl = "https://ekhub.vercel.app/app"
    private val appHost = "ekhub.vercel.app"

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setSupportZoom(false)
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.userAgentString = settings.userAgentString.replace("; wv", "")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return handleUrl(request.url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                return handleUrl(Uri.parse(url))
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                findViewById<ProgressBar>(R.id.progress).visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView, url: String?) {
                findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: android.webkit.WebResourceError
            ) {
                if (request.isForMainFrame) {
                    findViewById<ProgressBar>(R.id.progress).visibility = View.GONE
                }
            }
        }

        webView.webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                findViewById<ProgressBar>(R.id.progress).progress = newProgress
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

        webView.loadUrl(homeUrl)
    }

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

    /** target=_blank / window.open: route app pages into the main WebView, others to the browser. */
    private fun handleNewWindow(resultMsg: Message): Boolean {
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
        val dummy = WebView(this)
        dummy.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (isAppUrl(uri)) {
                    webView.loadUrl(uri.toString())
                    return true
                }
                openExternal(uri)
                return true
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val uri = Uri.parse(url)
                if (isAppUrl(uri)) {
                    webView.loadUrl(url)
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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
