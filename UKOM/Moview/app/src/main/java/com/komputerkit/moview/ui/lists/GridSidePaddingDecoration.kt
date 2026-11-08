package com.komputerkit.moview.ui.lists

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * Inset for the outer columns of the list poster grid so it lines up with the
 * screen's content, exactly like the 12dp RecyclerView padding on the profile
 * film grid.
 *
 * It only offsets grid cells: a full-span header keeps its own edge-to-edge
 * layout (backdrop, title, stats).
 *
 * @param spanCount columns of the grid.
 * @param horizontalPadding padding added to the first and last column.
 * @param leadingItemCount non-grid items before the grid (e.g. the header).
 */
class GridSidePaddingDecoration(
    private val spanCount: Int,
    private val horizontalPadding: Int,
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

        // The header row spans the full width and handles its own padding.
        if (position < leadingItemCount) return

        val column = (position - leadingItemCount) % spanCount
        outRect.left = if (column == 0) horizontalPadding else 0
        outRect.right = if (column == spanCount - 1) horizontalPadding else 0
    }
}
