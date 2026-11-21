package com.komputerkit.moview.ui.common

import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.komputerkit.moview.R
import com.komputerkit.moview.util.PosterFallbackDrawable
import com.komputerkit.moview.util.ServerConfig

/**
 * Shared geometry + poster loading for every film grid (poster berjejer).
 *
 * The cell size is derived ONCE per grid width and span (not per item, not from
 * a child's possibly-stale measurement), and every poster is decoded at exactly
 * that size. Same size for every bind = Glide memory cache hits on scroll-back.
 */
object FilmGridCell {

    /** Cell width/height for one grid, recomputed only when the grid width changes. */
    class Size {
        private var gridWidth = -1
        private var spanCache = -1
        var width = 0
            private set
        var height = 0
            private set

        /** Returns true when [width]/[height] were recomputed. */
        fun update(grid: RecyclerView, span: Int): Boolean {
            val available = grid.width - grid.paddingLeft - grid.paddingRight
            if (available <= 0) return false
            if (available == gridWidth && span == spanCache) return false
            gridWidth = available
            spanCache = span
            width = (available / span.coerceAtLeast(1)).coerceAtLeast(1)
            height = width * 3 / 2
            return true
        }
    }

    /**
     * Load one poster into a fixed-size cell: exact target size, no crossfade, no
     * shimmer. The loading placeholder is a flat solid tile; a missing or failed
     * poster shows the title fallback (same as before).
     */
    fun loadPoster(view: ImageView, url: String?, title: String?, width: Int, height: Int) {
        val fallback = PosterFallbackDrawable(view.context, title)
        if (url.isNullOrEmpty()) {
            view.setImageDrawable(fallback)
            return
        }
        val target = if (width > 0 && height > 0) RequestOptions().override(width, height) else RequestOptions()
        Glide.with(view.context)
            .load(ServerConfig.fixUrl(url))
            .apply(
                target
                    .diskCacheStrategy(DiskCacheStrategy.RESOURCE)
                    .centerCrop()
                    .dontAnimate()
                    .placeholder(R.drawable.placeholder_poster)
                    .error(fallback)
            )
            .into(view)
    }
}
