package com.komputerkit.moview.util

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.Drawable
import androidx.core.content.ContextCompat
import com.komputerkit.moview.R

/**
 * Poster fallback: solid theme background with the movie title centered,
 * so failed/empty posters still show a readable, theme-consistent placeholder.
 */
class PosterFallbackDrawable(
    private val context: android.content.Context,
    private val title: String?
) : Drawable() {

    private val bgPaint = Paint().apply { color = ContextCompat.getColor(context, R.color.dark_card) }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.text_primary)
        textSize = dp(11f)
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
        setShadowLayer(dp(4f), 0f, dp(2f), 0xCC000000.toInt())
    }

    override fun draw(canvas: Canvas) {
        canvas.drawRect(bounds, bgPaint)

        val title = title?.trim()
        if (title.isNullOrEmpty()) return

        val words = title.split(" ")
        val lines = ArrayList<String>()
        var current = ""
        for (word in words) {
            val candidate = if (current.isEmpty()) word else "$current $word"
            if (textPaint.measureText(candidate) <= bounds.width() - dp(12f)) {
                current = candidate
            } else {
                if (current.isNotEmpty()) lines.add(current)
                current = word
            }
        }
        if (current.isNotEmpty()) lines.add(current)

        val maxLines = 4
        if (lines.size > maxLines) {
            val truncated = lines.take(maxLines - 1).toMutableList()
            val last = lines[maxLines - 1]
            var tail = "…"
            var idx = last.length - 1
            while (idx > 0 && textPaint.measureText(last.take(idx) + tail) > bounds.width() - dp(12f)) {
                idx--
            }
            truncated.add(last.take(idx) + tail)
            drawCenteredLines(canvas, truncated)
        } else {
            drawCenteredLines(canvas, lines)
        }
    }

    private fun drawCenteredLines(canvas: Canvas, lines: List<String>) {
        val lineHeight = textPaint.fontSpacing
        val totalHeight = lineHeight * lines.size
        var y = bounds.centerY() + (lineHeight / 2f) - (totalHeight / 2f)
        for (line in lines) {
            canvas.drawText(line, bounds.centerX().toFloat(), y, textPaint)
            y += lineHeight
        }
    }

    private fun dp(value: Float): Float = value * context.resources.displayMetrics.density

    override fun setAlpha(alpha: Int) = Unit
    override fun setColorFilter(colorFilter: android.graphics.ColorFilter?) = Unit
    override fun getOpacity(): Int = android.graphics.PixelFormat.OPAQUE
}