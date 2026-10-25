package com.komputerkit.moview.ui.share

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Loads remote artwork into plain [Bitmap]s so it can be drawn with Canvas.
 *
 * Uses Glide (already used across the app) and resolves URLs through
 * [com.komputerkit.moview.util.ServerConfig.fixUrl] the same way the rest of the UI does.
 * Failures resolve to `null` instead of throwing, so the poster keeps a placeholder panel.
 */
object ShareBitmapLoader {

    suspend fun load(
        context: Context,
        url: String?,
        targetWidth: Int,
        targetHeight: Int
    ): Bitmap? {
        if (url.isNullOrBlank()) return null
        val fixedUrl = com.komputerkit.moview.util.ServerConfig.fixUrl(url)

        return suspendCancellableCoroutine { continuation ->
            val options = RequestOptions()
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .format(DecodeFormat.PREFER_ARGB_8888)
                .override(targetWidth, targetHeight)
                .centerCrop()

            val target = object : CustomTarget<Bitmap>(targetWidth, targetHeight) {
                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                    if (continuation.isActive) continuation.resume(resource)
                }

                override fun onLoadCleared(placeholder: Drawable?) {
                    if (continuation.isActive) continuation.resume(null)
                }

                override fun onLoadFailed(errorDrawable: Drawable?) {
                    if (continuation.isActive) continuation.resume(null)
                }
            }

            Glide.with(context.applicationContext)
                .asBitmap()
                .load(fixedUrl)
                .apply(options)
                .into(target)

            continuation.invokeOnCancellation { Glide.with(context.applicationContext).clear(target) }
        }
    }
}