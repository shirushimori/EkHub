package com.ekhub.app

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import java.io.File
import java.net.URLDecoder

/** Metadata the web app sends us right before a file download starts. */
data class DownloadContext(
    val title: String,
    val type: String,
    val season: String?,
    val episode: String?,
    val fileName: String?
)

/** A finished download ready to show in the completion banner. */
data class CompletedDownload(
    val title: String,
    val relPath: String,
    val isVideo: Boolean
) {
    fun absolutePath(context: Context): String =
        File(context.getExternalFilesDir(Environment.DIRECTORY_MOVIES), relPath).absolutePath
}

/**
 * Routes web downloads into organized folders via [DownloadManager]:
 *
 *   Movies → Movies/<Title>/<file>
 *   Series → Series/<Title>/Season <n>/<file>
 *
 * Everything lives under the app-private external files dir, so no storage
 * permission is needed and the built-in player can open the files directly.
 */
class DownloadRepository(private val context: Context) {

    private val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

    private val videoExtensions = setOf(
        "mp4", "mkv", "webm", "avi", "mov", "wmv", "flv", "m4v", "3gp", "ts", "mpg", "mpeg"
    )

    /** downloadId → pending completion banner info. */
    private val pending = HashMap<Long, CompletedDownload>()

    var listener: ((CompletedDownload) -> Unit)? = null

    fun enqueue(
        url: String,
        userAgent: String?,
        contentType: String?,
        contentDisposition: String?,
        ctx: DownloadContext?
    ) {
        val fileName = resolveFileName(url, contentDisposition, contentType, ctx)
        val relPath = resolveRelativePath(ctx, fileName)

        val request = DownloadManager.Request(Uri.parse(url))
        request.setMimeType(contentType)
        if (!userAgent.isNullOrEmpty()) request.addRequestHeader("User-Agent", userAgent)
        request.setTitle(ctx?.title ?: fileName)
        request.setDescription(relPath)
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_MOVIES, relPath)
        request.setAllowedOverMetered(true)

        val id = manager.enqueue(request)
        pending[id] = CompletedDownload(
            title = ctx?.title ?: fileName,
            relPath = relPath,
            isVideo = isVideoFile(fileName)
        )
    }

    /** Call from a BroadcastReceiver registered for ACTION_DOWNLOAD_COMPLETE. */
    fun onDownloadComplete(intent: Intent) {
        val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
        if (id == -1L) return
        val info = pending.remove(id) ?: return
        if (!wasSuccessful(id)) return
        listener?.invoke(info)
    }

    private fun wasSuccessful(id: Long): Boolean {
        val q = manager.query(DownloadManager.Query().setFilterById(id))
        return try {
            if (!q.moveToFirst()) false
            else q.getInt(q.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL
        } finally {
            q.close()
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private fun resolveFileName(
        url: String,
        contentDisposition: String?,
        contentType: String?,
        ctx: DownloadContext?
    ): String {
        contentDisposition?.let { cd ->
            val star = Regex("filename\\*=UTF-8''([^;]+)", RegexOption.IGNORE_CASE)
                .find(cd)?.groupValues?.getOrNull(1)
            if (star != null) {
                runCatching { URLDecoder.decode(star, "UTF-8") }.getOrNull()?.let { return sanitize(it) }
            }
            val plain = Regex("filename=\"?([^\";]+)\"?", RegexOption.IGNORE_CASE)
                .find(cd)?.groupValues?.getOrNull(1)
            if (plain != null && plain.isNotBlank()) return sanitize(plain)
        }

        runCatching { Uri.parse(url).lastPathSegment }
            .getOrNull()
            ?.takeIf { it.isNotBlank() && it != "/" }
            ?.let { return sanitize(it) }

        val base = sanitize(ctx?.fileName).ifBlank { sanitize(ctx?.title).ifBlank { "download" } }
        val ext = contentType?.substringAfter('/', "")?.takeIf { it.length in 3..5 }
            ?.let { if (it in videoExtensions) it else null }
        return if (ext != null) "$base.$ext" else base
    }

    private fun resolveRelativePath(ctx: DownloadContext?, fileName: String): String {
        val title = sanitize(ctx?.title).ifBlank { "Misc" }
        return if (ctx?.type == "series") {
            val season = sanitize(ctx.season).ifBlank { "Season 1" }
            "$title/$season/$fileName"
        } else {
            "$title/$fileName"
        }
    }

    private fun sanitize(value: String?): String {
        if (value.isNullOrBlank()) return ""
        val cleaned = value.replace(Regex("[\\\\/:*?\"<>|\\n\\r\\t]"), " ")
            .trim()
            .replace(Regex("\\s+"), " ")
        return cleaned.take(120)
    }

    private fun isVideoFile(fileName: String): Boolean {
        val ext = fileName.substringAfterLast('.', "").lowercase()
        return ext in videoExtensions
    }
}
