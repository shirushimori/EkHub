package com.ekhub.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/** Download manager (prototype) — lists links queued by the web app. */
class DownloadsActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF1A1A1A.toInt())
        }

        root.addView(
            TextView(this).apply {
                text = "Downloads"
                setTextColor(Color.WHITE)
                textSize = 20f
                setPadding(24, 28, 24, 8)
            }
        )

        val hint = TextView(this).apply {
            text = "Links you tap in the app appear here. Open them in the app to continue."
            setTextColor(0xFF9CA3AF.toInt())
            textSize = 13f
            setPadding(24, 0, 24, 16)
        }
        root.addView(hint)

        root.addView(
            ScrollView(this).apply {
                isFillViewport = true
            },
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        )

        val clear = Button(this).apply {
            text = "Clear all"
        }
        root.addView(clear, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { setMargins(24, 8, 24, 24) })

        setContentView(root)

        val scroll = root.getChildAt(2) as ScrollView
        val listContainer = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        scroll.addView(
            listContainer,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        render(listContainer)

        clear.setOnClickListener {
            DownloadStore.clear(this)
            render(listContainer)
            Toast.makeText(this, "Downloads cleared", Toast.LENGTH_SHORT).show()
        }
    }

    private fun render(container: LinearLayout) {
        container.removeAllViews()
        val entries = DownloadStore.list(this)
        if (entries.isEmpty()) {
            container.addView(
                TextView(this).apply {
                    text = "No downloads yet."
                    setTextColor(0xFF9CA3AF.toInt())
                    textSize = 14f
                    gravity = Gravity.CENTER
                    setPadding(0, 48, 0, 48)
                }
            )
            return
        }
        for (entry in entries) {
            container.addView(entryRow(entry, container))
        }
    }

    private fun entryRow(entry: DownloadEntry, container: LinearLayout): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 16, 24, 16)
        }

        card.addView(
            TextView(this).apply {
                text = entry.title.ifBlank { entry.fileName.ifBlank { "Download" } }
                setTextColor(Color.WHITE)
                textSize = 15f
                isSingleLine = true
            }
        )

        val sub = listOfNotNull(
            entry.type.takeIf { it.isNotEmpty() },
            entry.season.takeIf { it.isNotEmpty() },
            entry.episode.takeIf { it.isNotEmpty() },
            entry.fileName.takeIf { it.isNotEmpty() }
        ).joinToString(" · ")
        if (sub.isNotEmpty()) {
            card.addView(
                TextView(this).apply {
                    text = sub
                    setTextColor(0xFF9CA3AF.toInt())
                    textSize = 12f
                    setPadding(0, 2, 0, 0)
                }
            )
        }

        card.addView(
            TextView(this).apply {
                text = entry.url
                setTextColor(0xFF4F8CFF.toInt())
                textSize = 11f
                setPadding(0, 2, 0, 12)
            }
        )

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        row.addView(
            Button(this).apply {
                text = "Open"
                setOnClickListener { openInApp(entry) }
            },
            LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            ).apply { rightMargin = 16 }
        )
        row.addView(
            Button(this).apply {
                text = "Remove"
                setOnClickListener {
                    DownloadStore.remove(this@DownloadsActivity, entry.id)
                    render(container)
                }
            },
            LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            )
        )
        card.addView(row)

        return card
    }

    private fun openInApp(entry: DownloadEntry) {
        val intent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_MAIN
            putExtra("open_url", entry.url)
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        startActivity(intent)
    }
}
