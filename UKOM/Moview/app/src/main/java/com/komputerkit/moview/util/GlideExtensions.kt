package com.komputerkit.moview.util

import android.graphics.drawable.Drawable
import android.view.ViewGroup
import android.widget.ImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.bumptech.glide.request.RequestOptions
import com.komputerkit.moview.R

/**
 * Extension functions for fast image loading with Glide.
 *
 * List/grid helpers always decode at a fixed target size (never the source
 * resolution) and always use the same target for the same kind of cell, so
 * scrolling back to an item is a memory-cache hit instead of a re-decode.
 */

// Load poster image with optimizations
fun ImageView.loadPoster(url: String?, title: String? = null, placeholder: Drawable? = null) {
    if (url.isNullOrEmpty()) {
        // Show fallback if URL is null or empty
        this.setImageDrawable(PosterFallbackDrawable(context, title))
        return
    }
    val fixedUrl = ServerConfig.fixUrl(url)
    
    Glide.with(this.context)
        .load(fixedUrl)
        .thumbnail(0.1f) // Load low-res thumbnail first for instant display
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: PosterFallbackDrawable(context, title))
                .error(PosterFallbackDrawable(context, title))
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache both original & resized
                .centerCrop() // Ensure proper cropping without distortion
        )
        .transition(DrawableTransitionOptions.withCrossFade(200))
        .into(this)
}

// Load backdrop image with optimizations
fun ImageView.loadBackdrop(url: String?, placeholder: Drawable? = null) {
    if (url.isNullOrEmpty()) {
        // Show dark placeholder if URL is null or empty
        this.setImageResource(android.R.color.transparent)
        return
    }
    val fixedUrl = ServerConfig.fixUrl(url)
    
    Glide.with(this.context)
        .load(fixedUrl)
        .thumbnail(0.1f) // Load low-res thumbnail first
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(android.R.color.transparent))
                .error(android.R.color.transparent)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerCrop() // Ensure proper cropping without distortion
        )
        .transition(DrawableTransitionOptions.withCrossFade(200))
        .into(this)
}

/**
 * List-item poster (horizontal carousels, search rows, review rows).
 * Decodes at a fixed 2:3 target so every bind of the same cell reuses the
 * exact same bitmap from Glide's memory cache.
 */
fun ImageView.loadThumbnail(url: String?, title: String? = null, placeholder: Drawable? = null) {
    if (url.isNullOrEmpty()) {
        this.setImageDrawable(PosterFallbackDrawable(context, title))
        return
    }

    val targetWidth = resolveThumbWidth()
    val targetHeight = targetWidth * 3 / 2
    // One fallback instance for both placeholder and error (halves per-bind allocations)
    val fallback = placeholder ?: PosterFallbackDrawable(context, title)

    Glide.with(this.context)
        .load(ServerConfig.fixUrl(url))
        .apply(
            RequestOptions()
                .placeholder(fallback)
                .error(fallback)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerCrop()
                .dontAnimate()
                .override(targetWidth, targetHeight)
        )
        .into(this)
}

/**
 * Poster cell in a fixed-column grid: always decodes at (a bit above) cell
 * size instead of the source resolution, so long lists stay smooth.
 */
fun ImageView.loadGridThumbnail(
    url: String?,
    title: String? = null,
    spanCount: Int = 4
) {
    if (url.isNullOrEmpty()) {
        this.setImageDrawable(PosterFallbackDrawable(context, title))
        return
    }

    val cellWidth = gridCellWidthPx(spanCount)
    val cellHeight = cellWidth * 3 / 2

    val fallback = PosterFallbackDrawable(context, title)
    Glide.with(this.context)
        .load(ServerConfig.fixUrl(url))
        .apply(
            RequestOptions()
                .placeholder(fallback)
                .error(fallback)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerCrop()
                .dontAnimate()
                .override(cellWidth, cellHeight)
        )
        .into(this)
}

/** Width of one poster cell for a [spanCount]-column grid on this screen. */
fun ImageView.gridCellWidthPx(spanCount: Int): Int {
    val metrics = resources.displayMetrics
    return (metrics.widthPixels / spanCount.coerceAtLeast(1))
        .coerceIn(1, MAX_GRID_THUMB_WIDTH_PX)
}

/** Fixed decode width for a poster in a list row / carousel card. */
private fun ImageView.resolveThumbWidth(): Int {
    val lpWidth = layoutParams?.width ?: ViewGroup.LayoutParams.WRAP_CONTENT
    if (lpWidth > 0) return lpWidth.coerceIn(1, MAX_GRID_THUMB_WIDTH_PX)
    if (width > 0) return width.coerceIn(1, MAX_GRID_THUMB_WIDTH_PX)
    // 0dp (constraint-driven) or not measured yet: use the same fixed target
    // for every cell so the memory cache always hits.
    return DEFAULT_THUMB_WIDTH_PX
}

/** Widest decode for a poster cell (~2x a 4-column cell on a 1080px screen). */
private const val MAX_GRID_THUMB_WIDTH_PX = 360
private const val DEFAULT_THUMB_WIDTH_PX = 240

// Load profile/avatar image with circular crop
fun ImageView.loadAvatar(url: String?, placeholder: Drawable? = null) {
    if (url.isNullOrEmpty()) {
        this.setImageResource(R.drawable.ic_default_profile)
        return
    }
    val fixedUrl = ServerConfig.fixUrl(url)
    Glide.with(this.context)
        .load(fixedUrl)
        .thumbnail(0.1f) // Load low-res thumbnail first
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.ic_default_profile))
                .error(R.drawable.ic_default_profile)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop() // Circle crop handles sizing
        )
        .transition(DrawableTransitionOptions.withCrossFade(150))
        .into(this)
}

// Load logo/icon with small size
fun ImageView.loadLogo(url: String?, placeholder: Drawable? = null) {
    val fixedUrl = if (!url.isNullOrEmpty()) ServerConfig.fixUrl(url) else url
    Glide.with(this.context)
        .load(fixedUrl)
        .thumbnail(0.1f) // Load low-res thumbnail first
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.logo_moview))
                .error(R.drawable.logo_moview)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerInside() // Fit logo without cropping
        )
        .transition(DrawableTransitionOptions.withCrossFade(100))
        .into(this)
}

// Load profile photo with optimizations (same strategy as poster/backdrop)
fun ImageView.loadProfilePhoto(url: String?) {
    if (url.isNullOrEmpty()) {
        // Show default profile icon if URL is null or empty
        this.setImageResource(R.drawable.ic_default_profile)
        return
    }
    val fixedUrl = ServerConfig.fixUrl(url)
    
    Glide.with(this.context)
        .load(fixedUrl)
        .thumbnail(0.1f) // Load low-res thumbnail first for instant display
        .apply(
            RequestOptions()
                .placeholder(R.drawable.ic_default_profile)
                .error(R.drawable.ic_default_profile)
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache both original & resized
                .circleCrop() // Circle crop for profile photo
        )
        .transition(DrawableTransitionOptions.withCrossFade(200))
        .into(this)
}
