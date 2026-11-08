package com.komputerkit.moview.ui.lists

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R

/**
 * Rank number drawn over each poster cell (top center of the poster).
 *
 * It is a pure overlay: the item layout, size and spacing are untouched, and
 * nothing can clip it because it is drawn inside the poster's own bounds.
 *
 * @param grid the RecyclerView this decoration belongs to.
 * @param leadingItemCount non-grid items before the grid (e.g. a full-span
 *  header) that must not receive a badge.
 */
class RankBadgeDecoration(
    private val grid: RecyclerView,
    private val leadingItemCount: Int = 0
) : RecyclerView.ItemDecoration() {

    private val density = grid.resources.displayMetrics.density
    private val badgeSize = (BADGE_SIZE_DP * density).toInt()
    private val topInset = (TOP_INSET_DP * density).toInt()

    private val badge: Drawable? =
        ContextCompat.getDrawable(grid.context, R.drawable.bg_rank_badge)

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(grid.context, R.color.text_primary)
        textAlign = Paint.Align.CENTER
        textSize = BADGE_TEXT_SP * grid.resources.displayMetrics.scaledDensity
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }

    /** Only ranked lists show numbers; toggling repaints without re-layout. */
    var ranked: Boolean = false
        set(value) {
            if (field == value) return
            field = value
            grid.invalidate()
        }

    override fun onDrawOver(canvas: Canvas, parent: RecyclerView, state: RecyclerView.State) {
        if (!ranked) return

        for (i in 0 until parent.childCount) {
            val child = parent.getChildAt(i)
            val position = parent.getChildAdapterPosition(child)
            if (position < leadingItemCount) continue

            val rank = position - leadingItemCount + 1
            val centerX = child.left + child.width / 2
            val top = child.top + topInset

            badge?.let { drawable ->
                drawable.setBounds(
                    centerX - badgeSize / 2,
                    top,
                    centerX + badgeSize / 2,
                    top + badgeSize
                )
                drawable.draw(canvas)
            }

            val label = rank.toString()
            val metrics = textPaint.fontMetrics
            val baseline = top + badgeSize / 2f - (metrics.ascent + metrics.descent) / 2f
            canvas.drawText(label, centerX.toFloat(), baseline, textPaint)
        }
    }

    private companion object {
        const val BADGE_SIZE_DP = 20
        const val TOP_INSET_DP = 4
        const val BADGE_TEXT_SP = 9f
    }
}
