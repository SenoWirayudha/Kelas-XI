package com.komputerkit.moview.ui.lists

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * Adds vertical space between poster rows so the rank badge (which is drawn
 * above the cell) never overlaps the poster in the row above.
 *
 * [leadingItemCount] lets a screen put non-grid items (e.g. a header) before
 * the grid without the first row being treated as a continuation.
 */
class RankRowSpacingDecoration(
    private val spanCount: Int,
    private val spacing: Int,
    private val leadingItemCount: Int = 0
) : RecyclerView.ItemDecoration() {

    override fun getItemOffsets(
        outRect: Rect,
        view: View,
        parent: RecyclerView,
        state: RecyclerView.State
    ) {
        val position = parent.getChildAdapterPosition(view)
        if (position < 0) return
        // Every grid row after the first gets breathing room at the top.
        if (position - leadingItemCount >= spanCount) outRect.top = spacing
    }
}
