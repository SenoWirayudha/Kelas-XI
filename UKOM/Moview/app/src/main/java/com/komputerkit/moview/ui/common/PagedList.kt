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
import java.util.WeakHashMap

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

    /** Guards against posting two auto-load checks for the same list at once. */
    private val autoLoadPosted = WeakHashMap<RecyclerView, Boolean>()

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

    /**
     * Dipanggil setelah setiap render halaman: kalau konten belum memenuhi
     * layar (atau akhir daftar sudah terlihat) minta halaman berikutnya.
     *
     * Aman dari loop tak terbatas dan load ganda: satu pemeriksaan di-post per
     * daftar, dan [onLoadMore] harus tetap dijaga oleh guard "sedang loading /
     * halaman terakhir" di ViewModel masing-masing layar.
     */
    fun autoLoadIfNotFilled(recyclerView: RecyclerView, onLoadMore: () -> Unit) {
        if (autoLoadPosted[recyclerView] == true) return
        autoLoadPosted[recyclerView] = true
        recyclerView.post {
            autoLoadPosted.remove(recyclerView)
            if (!recyclerView.isAttachedToWindow) return@post
            val lm = recyclerView.layoutManager as? LinearLayoutManager ?: return@post
            val total = lm.itemCount
            if (total == 0) return@post
            val endVisible = lm.findLastVisibleItemPosition() >= total - 1
            if (!endVisible && recyclerView.canScrollVertically(1)) return@post
            onLoadMore()
        }
    }

    /** Daftar yang isinya di dalam scroller luar (NestedScrollView/ScrollView). */
    fun autoLoadIfNotFilled(
        scroller: View,
        recyclerView: RecyclerView,
        onLoadMore: () -> Unit
    ) {
        if (autoLoadPosted[recyclerView] == true) return
        autoLoadPosted[recyclerView] = true
        scroller.post {
            autoLoadPosted.remove(recyclerView)
            if (!scroller.isAttachedToWindow) return@post
            if (recyclerView.adapter?.itemCount == 0) return@post
            if (scroller.canScrollVertically(1)) return@post
            onLoadMore()
        }
    }
}
