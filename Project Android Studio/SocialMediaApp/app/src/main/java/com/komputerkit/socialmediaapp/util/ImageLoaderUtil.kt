package com.komputerkit.socialmediaapp.util

import android.graphics.BitmapFactory
import android.util.Base64
import android.widget.ImageView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R

object ImageLoaderUtil {
    /**
     * Load image from either a URL or a base64 string (with or without prefix) into an ImageView.
     * - If imageString starts with http/https, load with Glide.
     * - If imageString starts with "data:image", decode base64 and set bitmap.
     * - If imageString is base64 without prefix, add prefix and decode.
     * - If imageString is null/empty, set placeholder.
     */
    fun load(imageView: ImageView, imageString: String?) {
        if (imageString.isNullOrEmpty()) {
            imageView.setImageResource(R.drawable.ic_launcher_foreground)
            return
        }
        
        if (imageString.startsWith("http://") || imageString.startsWith("https://")) {
            Glide.with(imageView.context)
                .load(imageString)
                .placeholder(R.drawable.ic_launcher_foreground)
                .error(R.drawable.ic_launcher_foreground)
                .into(imageView)
            return
        }
        
        // Handle base64 images
        val base64String = when {
            imageString.startsWith("data:image") -> imageString.substringAfter(",")
            else -> imageString
        }
        
        try {
            val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            if (bitmap != null) {
                imageView.setImageBitmap(bitmap)
                // Adjust view to show image in its original aspect ratio
                imageView.adjustViewBounds = true
            } else {
                imageView.setImageResource(R.drawable.ic_launcher_foreground)
            }
        } catch (e: Exception) {
            imageView.setImageResource(R.drawable.ic_launcher_foreground)
        }
    }
}
