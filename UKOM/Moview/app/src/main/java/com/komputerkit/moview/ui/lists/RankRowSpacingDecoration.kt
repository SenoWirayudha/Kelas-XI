package com.komputerkit.moview.ui.lists

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * Adds vertical space between poster rows so the rank badge (which is drawn
 * above the cell) never overlaps the poster in the row above.
 */
class RankRowSpacingDecoration(
    private val spanCount: Int,
    private val spacing: Int
) : RecyclerView.ItemDecoration() {

    override fun getItemOffsets(
        outRect: Rect,
        view: View,
        parent: RecyclerView,
        state: RecyclerView.State
    ) {
        val position = parent.getChildAdapterPosition(view)
        if (position < 0) return
        // Every row after the first gets breathing room at the top.
        if (position >= spanCount) outRect.top = spacing
    }
}
