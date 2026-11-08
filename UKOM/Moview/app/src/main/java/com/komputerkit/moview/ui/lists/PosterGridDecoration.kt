package com.komputerkit.moview.ui.lists

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * Single decoration for the list poster grids.
 *
 * - Adds side padding on the outer columns so the grid lines up with the
 *   screen's other content (title, description, avatar) instead of sticking to
 *   the screen edges.
 * - Adds the extra row gap the rank badge needs so it never overlaps the
 *   poster above it.
 *
 * Attach once per grid. [rankSpacingEnabled] switches the row gap on/off and
 * invalidates the decoration so rows re-measure.
 *
 * @param grid the RecyclerView this decoration belongs to.
 * @param spanCount columns of the grid.
 * @param horizontalPadding side padding matching the screen's content (16dp).
 * @param rankRowSpacing extra top gap for every grid row after the first.
 * @param leadingItemCount non-grid items before the grid (e.g. a full-span
 *  header) that must not receive grid offsets.
 */
class PosterGridDecoration(
    private val grid: RecyclerView,
    private val spanCount: Int,
    private val horizontalPadding: Int,
    private val rankRowSpacing: Int,
    private val leadingItemCount: Int = 0
) : RecyclerView.ItemDecoration() {

    /** Row gap is only needed while the rank badge is shown. */
    var rankSpacingEnabled: Boolean = false
        set(value) {
            if (field == value) return
            field = value
            grid.invalidateItemDecorations()
        }

    override fun getItemOffsets(
        outRect: Rect,
        view: View,
        parent: RecyclerView,
        state: RecyclerView.State
    ) {
        val position = parent.getChildAdapterPosition(view)
        if (position < 0) return

        // Header rows keep their own padding.
        if (position < leadingItemCount) return

        val gridIndex = position - leadingItemCount
        val column = gridIndex % spanCount

        outRect.left = if (column == 0) horizontalPadding else 0
        outRect.right = if (column == spanCount - 1) horizontalPadding else 0

        if (rankSpacingEnabled && gridIndex >= spanCount) {
            outRect.top = rankRowSpacing
        }
    }
}
