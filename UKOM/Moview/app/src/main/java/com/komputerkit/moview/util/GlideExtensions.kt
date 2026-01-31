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
 * Extension functions for fast image loading with Glide
 */

// Load poster image with optimizations
fun ImageView.loadPoster(url: String?, placeholder: Drawable? = null) {
    Glide.with(this.context)
        .load(url)
        .thumbnail(0.1f) // Load low-res thumbnail first for instant display
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.ic_launcher_background))
                .error(R.drawable.ic_launcher_background)
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache both original & resized
                .centerCrop() // Ensure proper cropping without distortion
        )
        .transition(DrawableTransitionOptions.withCrossFade(200))
        .into(this)
}

// Load backdrop image with optimizations
fun ImageView.loadBackdrop(url: String?, placeholder: Drawable? = null) {
    Glide.with(this.context)
        .load(url)
        .thumbnail(0.1f) // Load low-res thumbnail first
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.ic_launcher_background))
                .error(R.drawable.ic_launcher_background)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerCrop() // Ensure proper cropping without distortion
        )
        .transition(DrawableTransitionOptions.withCrossFade(200))
        .into(this)
}

// Load thumbnail image (for grids/lists)
fun ImageView.loadThumbnail(url: String?, placeholder: Drawable? = null) {
    // Get ImageView dimensions to override Glide sizing
    val width = this.layoutParams?.width ?: ViewGroup.LayoutParams.WRAP_CONTENT
    val height = this.layoutParams?.height ?: ViewGroup.LayoutParams.WRAP_CONTENT
    
    val requestBuilder = Glide.with(this.context)
        .load(url)
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.ic_launcher_background))
                .error(R.drawable.ic_launcher_background)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerCrop() // Ensure proper cropping without distortion
                .dontAnimate() // Disable animation to prevent stretching
        )
    
    // If we have specific dimensions, override to prevent stretching
    if (width > 0 && height > 0) {
        requestBuilder.override(width, height)
    }
    
    requestBuilder.into(this)
}

// Load profile/avatar image with circular crop
fun ImageView.loadAvatar(url: String?, placeholder: Drawable? = null) {
    Glide.with(this.context)
        .load(url)
        .thumbnail(0.1f) // Load low-res thumbnail first
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.ic_launcher_background))
                .error(R.drawable.ic_launcher_background)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop() // Circle crop handles sizing
        )
        .transition(DrawableTransitionOptions.withCrossFade(150))
        .into(this)
}

// Load logo/icon with small size
fun ImageView.loadLogo(url: String?, placeholder: Drawable? = null) {
    Glide.with(this.context)
        .load(url)
        .thumbnail(0.1f) // Load low-res thumbnail first
        .apply(
            RequestOptions()
                .placeholder(placeholder ?: context.getDrawable(R.drawable.ic_launcher_background))
                .error(R.drawable.ic_launcher_background)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerInside() // Fit logo without cropping
        )
        .transition(DrawableTransitionOptions.withCrossFade(100))
        .into(this)
}
