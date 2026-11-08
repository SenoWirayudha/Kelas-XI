package com.komputerkit.moview.ui.lists

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * One decoration that fixes the poster grid geometry for every cell.
 *
 * Cell size is computed in code and is identical in all columns:
 * `width = (available - 2*sideInset - (span-1)*gap) / span`,
 * `height = width * 1.5` (2:3 poster). The width/height are also written to each
 * item's layout params, so no column can end up wider than another.
 *
 * Spacing is produced by this decoration only (items have no margins):
 * [gap] between columns, [sideInset] on the outer edges (matching the rest of
 * the screen's content), and [badgeOverhang] above every row so the rank badge
 * can sit half above the poster.
 *
 * Insets are derived so that `left + right` is the same for every column, which
 * is what keeps the measured widths equal.
 *
 * @param spanCount columns of the grid.
 * @param sideInset horizontal padding of the outer columns.
 * @param gap spacing between columns and rows.
 * @param badgeOverhang half the rank badge height.
 * @param leadingItemCount full-span items before the grid (e.g. the header).
 */
class PosterGridSizingDecoration(
    private val spanCount: Int,
    private val sideInset: Int,
    private val gap: Int,
    private val badgeOverhang: Int,
    private val leadingItemCount: Int = 0,
    /** 2:3 poster ratio. */
    private val aspect: Float = 1.5f
) : RecyclerView.ItemDecoration() {

    private val span = spanCount.coerceAtLeast(1)

    /** Last computed cell size, exposed for tests/diagnostics. */
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

        val available = parent.width - parent.paddingLeft - parent.paddingRight
        if (available <= 0) return

        val spanWidth = available / span
        cellWidth = ((available - 2 * sideInset - (span - 1) * gap) / span).coerceAtLeast(1)
        cellHeight = (cellWidth * aspect).toInt()

        // Same fixed size for every cell (no content dependency, no margins).
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

        // left + right is constant, so every column measures exactly cellWidth.
        val insetTotal = spanWidth - cellWidth
        val step = cellWidth + gap - spanWidth
        outRect.left = sideInset + column * step
        outRect.right = insetTotal - outRect.left

        // Room for the half-overhanging badge, plus the gap between rows.
        outRect.top = if (isFirstRow) badgeOverhang else badgeOverhang + gap
        outRect.bottom = 0
    }
}
