package com.komputerkit.moview.ui.common

import android.view.View
import androidx.recyclerview.widget.RecyclerView

/**
 * Resolves the film-grid cell size for a holder from its parent RecyclerView.
 * One [FilmGridCell.Size] per RecyclerView, so the size is computed once per
 * grid width instead of per bind.
 */
object FilmGridSizes {

    private val sizes = java.util.WeakHashMap<RecyclerView, FilmGridCell.Size>()

    /** Cell (width, height) for [itemView] in a [span]-column grid, or null before layout. */
    fun cellFor(itemView: View, span: Int): Pair<Int, Int>? {
        val grid = itemView.parent as? RecyclerView ?: return null
        val size = sizes.getOrPut(grid) { FilmGridCell.Size() }
        size.update(grid, span)
        if (size.width <= 0) return null
        return size.width to size.height
    }
}
