package com.komputerkit.moview.ui.common

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.ConcatAdapter
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.StaggeredGridLayoutManager
import com.komputerkit.moview.R

/**
 * Pemicu loadMore: dipanggil saat sisa item di bawah posisi terlihat
 * <= threshold (prefetch, bukan nunggu mentok bawah).
 */
class PagedScrollListener(
    private val prefetchThreshold: Int,
    private val onLoadMore: () -> Unit
) : RecyclerView.OnScrollListener() {

    override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
        if (dy <= 0 && dx <= 0) return
        val lm = recyclerView.layoutManager ?: return
        val lastVisible = when (lm) {
            is GridLayoutManager -> lm.findLastVisibleItemPosition()
            is LinearLayoutManager -> lm.findLastVisibleItemPosition()
            is StaggeredGridLayoutManager -> lm.findLastVisibleItemPositions(null).maxOrNull() ?: return
            else -> return
        }
        val total = lm.itemCount
        if (total > 0 && lastVisible >= total - 1 - prefetchThreshold) {
            onLoadMore()
        }
    }
}

/**
 * Spinner kecil di ujung daftar, hanya terlihat saat menarik halaman berikutnya.
 * Dipasang lewat ConcatAdapter (lihat [PagedList.setup]).
 */
class LoadingFooterAdapter : RecyclerView.Adapter<LoadingFooterAdapter.ViewHolder>() {

    private var visible = false

    fun setVisible(show: Boolean) {
        if (visible == show) return
        visible = show
        if (show) notifyItemInserted(0) else notifyItemRemoved(0)
    }

    override fun getItemCount(): Int = if (visible) 1 else 0

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_loading_footer, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = Unit

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view)
}

object PagedList {

    /**
     * Pasang: adapter utama + footer + scroll listener (prefetch) sekaligus.
     * Untuk GridLayoutManager, footer dibuat full-span.
     * @return footer yang dikontrol oleh VM (setVisible sesuai isLoadingMore).
     */
    fun setup(
        recyclerView: RecyclerView,
        mainAdapter: RecyclerView.Adapter<*>,
        prefetchThreshold: Int = 12,
        onLoadMore: () -> Unit
    ): LoadingFooterAdapter {
        val footer = LoadingFooterAdapter()
        recyclerView.adapter = ConcatAdapter(mainAdapter, footer)

        val lm = recyclerView.layoutManager
        if (lm is GridLayoutManager) {
            lm.spanSizeLookup = object : GridLayoutManager.SpanSizeLookup() {
                override fun getSpanSize(position: Int): Int {
                    return if (position >= mainAdapter.itemCount) lm.spanCount else 1
                }
            }
        }

        recyclerView.addOnScrollListener(PagedScrollListener(prefetchThreshold, onLoadMore))
        return footer
    }
}
