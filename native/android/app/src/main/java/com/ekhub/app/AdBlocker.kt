package com.ekhub.app

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * AdAway-style host blocker: keeps a set of blocked hosts (from a bundled
 * hosts file plus optionally refreshed AdAway host sources) and answers
 * matching WebView requests with an empty response.
 */
object AdBlocker {
    private const val PREFS = "ekhub_adblock"
    private const val KEY = "hosts"
    private const val BUNDLED = "hosts.txt"

    // AdAway + friends public host sources, tried in order.
    private val SOURCES = listOf(
        "https://adaway.org/hosts.txt",
        "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
    )

    private val blocked = HashSet<String>()

    @Synchronized
    fun loadBundled(context: Context) {
        runCatching {
            context.assets.open(BUNDLED).bufferedReader().useLines { lines ->
                parse(lines, blocked)
            }
        }
        val cached = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
        if (cached != null) parse(cached.lineSequence(), blocked)
    }

    @Synchronized
    fun setHosts(text: String) {
        blocked.clear()
        parse(text.lineSequence(), blocked)
    }

    private fun parse(lines: Sequence<String>, into: MutableSet<String>) {
        for (raw in lines) {
            val line = raw.trim()
            if (line.isEmpty() || line.startsWith("#")) continue
            // Strip leading "0.0.0.0 host" / "127.0.0.1 host" style entries.
            val host = line.split(Regex("\\s+")).lastOrNull()
                ?.trim()
                ?.lowercase()
                ?.trimEnd('.')
                ?: continue
            if (host.isNotEmpty() && host.contains('.')) into.add(host)
        }
    }

    fun isBlocked(url: Uri): Boolean {
        if (url.scheme?.lowercase() != "http" && url.scheme?.lowercase() != "https") return false
        val host = url.host?.lowercase() ?: return false
        if (blocked.contains(host)) return true
        // Subdomains: *.doubleclick.net etc.
        var idx = host.indexOf('.')
        while (idx != -1) {
            val sub = host.substring(idx + 1)
            if (blocked.contains(sub)) return true
            idx = host.indexOf('.', idx + 1)
        }
        return false
    }

    fun emptyResponse(): WebResourceResponse =
        WebResourceResponse("text/plain", "utf-8", ByteArrayInputStream(ByteArray(0)))

    /** Fetches updated host lists in the background and caches them. */
    fun refresh(context: Context) {
        Thread {
            val merged = StringBuilder()
            for (src in SOURCES) {
                runCatching {
                    val conn = URL(src).openConnection() as HttpURLConnection
                    conn.connectTimeout = 10_000
                    conn.readTimeout = 15_000
                    conn.setRequestProperty("User-Agent", "EkHub")
                    merged.append(conn.inputStream.bufferedReader().readText())
                    merged.append('\n')
                    conn.disconnect()
                }
            }
            if (merged.isNotBlank()) {
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit().putString(KEY, merged.toString()).apply()
                setHosts(merged.toString())
            }
        }.start()
    }
}
