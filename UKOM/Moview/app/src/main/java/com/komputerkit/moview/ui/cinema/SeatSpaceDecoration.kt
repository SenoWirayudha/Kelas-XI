package com.komputerkit.moview.ui.cinema

import android.graphics.Rect
import android.view.View
import androidx.recyclerview.widget.RecyclerView

class SeatSpaceDecoration(private val spacePx: Int) : RecyclerView.ItemDecoration() {
    override fun getItemOffsets(
        outRect: Rect, view: View, parent: RecyclerView, state: RecyclerView.State
    ) {
        outRect.set(spacePx, spacePx, spacePx, spacePx)
    }
}
