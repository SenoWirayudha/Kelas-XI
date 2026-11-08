package com.komputerkit.moview.ui.lists

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * One decoration that fixes the poster grid geometry for every cell.
 *
 * The cell size is computed **once** from the real grid width (after layout),
 * never from a child's current (possibly stale) measurement, and the same
 * width/height is written to `LayoutParams` on every bind — so all columns and
 * the "+N" cell always match:
 *
 * `width = (availableWidth - sideInset - trailingInset - span*gap) / span`,
 * `height = width * 1.5` (2:3 poster).
 *
 * Spacing comes from this decoration only (items carry no margins). Every
 * column gets `left + right = gap + sideInset + trailingInset`, so the
 * `span*gap` term (not `(span-1)*gap`) is what makes `cell + insets` add up to
 * the available width exactly. [badgeOverhang] reserves half a badge above
 * every row so the rank badge can overhang the poster.
 *
 * @param spanCount columns of the grid.
 * @param sideInset outer inset added on the left of the grid; 0 when the
 *        RecyclerView already pads its left side.
 * @param trailingInset outer inset added on the right of the grid, so a grid
 *        inside a left-padded RecyclerView stays symmetric without forcing the
 *        full-span header (e.g. a full-bleed backdrop) to follow the padding.
 * @param gap spacing between columns and rows.
 * @param badgeOverhang half the rank badge height.
 * @param leadingItemCount full-span items before the grid (e.g. the header).
 */
class PosterGridSizingDecoration(
    private val spanCount: Int,
    private val sideInset: Int,
    /** Outer inset added on the right of the grid (see [sideInset]). */
    private val trailingInset: Int = 0,
    private val gap: Int,
    private val badgeOverhang: Int,
    private val leadingItemCount: Int = 0,
    /** 2:3 poster ratio. */
    private val aspect: Float = 1.5f
) : RecyclerView.ItemDecoration() {

    private val span = spanCount.coerceAtLeast(1)

    /** Width used for the computation; 0 until the grid has been laid out. */
    private var gridWidth = 0

    var cellWidth: Int = 0
        private set
    var cellHeight: Int = 0
        private set

    override fun getItemOffsets(
        outRect: Rect,
        view: View,
        parent: RecyclerView,
        state: RecyclerView.State
    ) {
        val position = parent.getChildAdapterPosition(view)
        if (position < 0) return

        // Full-span header items handle their own layout.
        if (position < leadingItemCount) return

        // Recompute only when the grid's own width changes (one calc per size).
        updateCellSize(parent)
        if (cellWidth <= 0) return

        // Reset then re-apply: a recycled view may still carry stale params
        // (e.g. a poster reused for the "+N" cell). Writing the same size on
        // every pass keeps all columns identical.
        view.layoutParams?.let { lp ->
            if (lp.width != cellWidth || lp.height != cellHeight) {
                lp.width = cellWidth
                lp.height = cellHeight
                view.layoutParams = lp
            }
        }

        val gridIndex = position - leadingItemCount
        val column = gridIndex % span
        val isFirstRow = gridIndex < span

        // Equal left+right for every column keeps the measured width fixed.
        // Total per column = gap (split between the two sides) plus the two
        // outer insets, so no column can drift past the right edge.
        outRect.left = sideInset + column * gap / span
        outRect.right = trailingInset + gap - (column + 1) * gap / span

        outRect.top = if (isFirstRow) badgeOverhang else badgeOverhang + gap
        outRect.bottom = 0
    }

    private fun updateCellSize(parent: RecyclerView) {
        val width = parent.width - parent.paddingLeft - parent.paddingRight
        if (width <= 0 || width == gridWidth) return

        gridWidth = width
        cellWidth = ((width - sideInset - trailingInset - span * gap) / span).coerceAtLeast(1)
        cellHeight = (cellWidth * aspect).toInt()
    }
}
