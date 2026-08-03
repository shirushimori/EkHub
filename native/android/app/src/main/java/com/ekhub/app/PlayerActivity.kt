package com.ekhub.app

import android.app.Activity
import android.os.Bundle
import android.view.WindowManager
import android.widget.MediaController
import android.widget.Toast
import android.widget.VideoView

/**
 * Minimal full-screen video player for files downloaded by [DownloadRepository].
 * Plays content:// or file:// paths passed via "path".
 */
class PlayerActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        val path = intent.getStringExtra("path")
        val title = intent.getStringExtra("title") ?: getString(R.string.app_name)
        setTitle(title)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val videoView = findViewById<VideoView>(R.id.player)

        val controller = MediaController(this)
        controller.setAnchorView(videoView)
        videoView.setMediaController(controller)

        videoView.setOnPreparedListener { videoView.start() }
        videoView.setOnErrorListener { _, _, _ ->
            Toast.makeText(this, R.string.player_unable_to_play, Toast.LENGTH_LONG).show()
            finish()
            true
        }

        if (path == null) {
            Toast.makeText(this, R.string.player_missing_file, Toast.LENGTH_LONG).show()
            finish()
            return
        }

        videoView.setVideoPath(path)
    }
}
