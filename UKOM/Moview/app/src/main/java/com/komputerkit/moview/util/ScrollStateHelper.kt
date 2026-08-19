package com.komputerkit.moview.util

import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

object ScrollStateHelper {

    fun save(rv: RecyclerView): Pair<Int, Int> {
        val lm = rv.layoutManager ?: return 0 to 0
        val linear = lm as? LinearLayoutManager ?: return 0 to 0
        val pos = linear.findFirstVisibleItemPosition()
        if (pos == RecyclerView.NO_POSITION) return 0 to 0
        val top = linear.findViewByPosition(pos)?.top ?: 0
        return pos to top
    }

    fun restore(rv: RecyclerView, state: Pair<Int, Int>?) {
        if (state == null) return
        val lm = rv.layoutManager as? LinearLayoutManager ?: return
        lm.scrollToPositionWithOffset(state.first, state.second)
    }
}
