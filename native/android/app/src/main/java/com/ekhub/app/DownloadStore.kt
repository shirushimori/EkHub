package com.ekhub.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * Download manager prototype — a persistent queue of links the web app hands
 * over via the EkHubNative JS bridge. Zero AndroidX, plain framework storage.
 */
data class DownloadEntry(
    val id: String,
    val title: String,
    val type: String,
    val season: String,
    val episode: String,
    val fileName: String,
    val url: String,
    val addedAt: Long
)

object DownloadStore {
    private const val PREFS = "ekhub_downloads"
    private const val KEY = "entries"

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun add(ctx: Context, entry: DownloadEntry): List<DownloadEntry> {
        val list = list(ctx).toMutableList()
        list.add(0, entry)
        save(ctx, list)
        return list
    }

    fun remove(ctx: Context, id: String): List<DownloadEntry> {
        val list = list(ctx).filterNot { it.id == id }
        save(ctx, list)
        return list
    }

    fun clear(ctx: Context) {
        prefs(ctx).edit().remove(KEY).apply()
    }

    fun list(ctx: Context): List<DownloadEntry> {
        val raw = prefs(ctx).getString(KEY, null) ?: return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            buildList {
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    add(
                        DownloadEntry(
                            id = o.optString("id"),
                            title = o.optString("title"),
                            type = o.optString("type"),
                            season = o.optString("season"),
                            episode = o.optString("episode"),
                            fileName = o.optString("fileName"),
                            url = o.optString("url"),
                            addedAt = o.optLong("addedAt")
                        )
                    )
                }
            }
        }.getOrDefault(emptyList())
    }

    private fun save(ctx: Context, entries: List<DownloadEntry>) {
        val arr = JSONArray()
        for (e in entries) {
            arr.put(
                JSONObject()
                    .put("id", e.id)
                    .put("title", e.title)
                    .put("type", e.type)
                    .put("season", e.season)
                    .put("episode", e.episode)
                    .put("fileName", e.fileName)
                    .put("url", e.url)
                    .put("addedAt", e.addedAt)
            )
        }
        prefs(ctx).edit().putString(KEY, arr.toString()).apply()
    }

    fun newId(): String = UUID.randomUUID().toString()
}
