package com.komputerkit.moview.util

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.Drawable
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat
import com.komputerkit.moview.R

/**
 * Poster fallback: solid theme background with the movie title centered,
 * so failed/empty posters still show a readable, theme-consistent placeholder.
 *
 * Paints (typeface + shadow) are shared per density and the wrapped title lines
 * are cached per bounds width: this drawable is created for every list item
 * bind, so per-instance Paint/typeface work is kept out of the scroll path.
 */
class PosterFallbackDrawable(
    private val context: android.content.Context,
    private val title: String?
) : Drawable() {

    private val density: Float = context.resources.displayMetrics.density

    private val bgPaint: Paint
        get() = backgroundPaint(context)

    private val textPaint: Paint
        get() = textPaintFor(context)

    // Cached word-wrapped lines for the last measured width.
    private var cachedWidth = -1
    private var cachedLines: List<String> = emptyList()

    override fun draw(canvas: Canvas) {
        canvas.drawRect(bounds, bgPaint)

        val title = title?.trim()
        if (title.isNullOrEmpty()) return

        val lines = wrapTitle(title, bounds.width() - dp(12f))
        if (lines.isEmpty()) return

        val maxLines = 4
        val visible = if (lines.size > maxLines) {
            val truncated = lines.take(maxLines - 1).toMutableList()
            val last = lines[maxLines - 1]
            var tail = "…"
            var idx = last.length - 1
            while (idx > 0 && textPaint.measureText(last.take(idx) + tail) > bounds.width() - dp(12f)) {
                idx--
            }
            truncated.add(last.take(idx) + tail)
            truncated
        } else {
            lines
        }
        drawCenteredLines(canvas, visible)
    }

    private fun wrapTitle(title: String, maxWidth: Float): List<String> {
        if (maxWidth <= 0f) return emptyList()
        if (cachedWidth == bounds.width()) return cachedLines

        val words = title.split(" ")
        val lines = ArrayList<String>()
        var current = ""
        for (word in words) {
            val candidate = if (current.isEmpty()) word else "$current $word"
            if (textPaint.measureText(candidate) <= maxWidth) {
                current = candidate
            } else {
                if (current.isNotEmpty()) lines.add(current)
                current = word
            }
        }
        if (current.isNotEmpty()) lines.add(current)

        cachedWidth = bounds.width()
        cachedLines = lines
        return lines
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

    private fun dp(value: Float): Float = value * density

    override fun setAlpha(alpha: Int) = Unit
    override fun setColorFilter(colorFilter: android.graphics.ColorFilter?) = Unit
    override fun getOpacity(): Int = android.graphics.PixelFormat.OPAQUE

    private companion object {
        /** One background Paint per density bucket (color is constant). */
        private val bgPaints = HashMap<Int, Paint>()

        /** One text Paint per density bucket (typeface/shadow are constant). */
        private val textPaints = HashMap<Int, Paint>()

        private fun densityKey(context: android.content.Context): Int =
            context.resources.displayMetrics.densityDpi

        fun backgroundPaint(context: android.content.Context): Paint {
            val key = densityKey(context)
            return bgPaints.getOrPut(key) {
                Paint().apply { color = ContextCompat.getColor(context, R.color.dark_card) }
            }
        }

        fun textPaintFor(context: android.content.Context): Paint {
            val key = densityKey(context)
            return textPaints.getOrPut(key) {
                val density = context.resources.displayMetrics.density
                Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = ContextCompat.getColor(context, R.color.text_primary)
                    textSize = 11f * density
                    textAlign = Paint.Align.CENTER
                    isFakeBoldText = true
                    typeface = ResourcesCompat.getFont(context, R.font.font_family_inter)
                    setShadowLayer(4f * density, 0f, 2f * density, 0xCC000000.toInt())
                }
            }
        }
    }
}
