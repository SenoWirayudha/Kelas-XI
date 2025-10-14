package com.komputerkit.socialmediaapp.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Base64
import android.util.Log
import android.view.View
import android.widget.ImageView
import android.widget.VideoView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import java.io.File

/**
 * MediaLoaderUtil - Utility untuk loading image dan video dari URL atau base64
 * Mendukung ImageView untuk image dan VideoView untuk video
 */
object MediaLoaderUtil {
    
    private const val TAG = "MediaLoaderUtil"
    
    /**
     * Load image ke ImageView dari URL atau base64
     * @param imageView Target ImageView
     * @param mediaUrl URL image atau base64 data URI
     * @param placeholder Resource ID untuk placeholder (optional)
     */
    fun loadImage(
        imageView: ImageView, 
        mediaUrl: String?, 
        placeholder: Int? = null
    ) {
        if (mediaUrl.isNullOrEmpty()) {
            // Show placeholder if available
            placeholder?.let { imageView.setImageResource(it) }
            return
        }
        
        try {
            when {
                // Base64 data URI
                mediaUrl.startsWith("data:image/") && mediaUrl.contains(";base64,") -> {
                    loadImageFromBase64(imageView, mediaUrl, placeholder)
                }
                // Regular URL
                mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://") -> {
                    loadImageFromUrl(imageView, mediaUrl, placeholder)
                }
                // Legacy base64 without prefix
                else -> {
                    loadImageFromBase64(imageView, "data:image/jpeg;base64,$mediaUrl", placeholder)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading image", e)
            placeholder?.let { imageView.setImageResource(it) }
        }
    }
    
    /**
     * Load video ke VideoView dari URL atau base64
     * @param videoView Target VideoView
     * @param mediaUrl URL video atau base64 data URI
     * @param thumbnailImageView ImageView untuk menampilkan thumbnail (optional)
     * @param thumbnailUrl URL atau base64 untuk thumbnail (optional)
     */
    fun loadVideo(
        videoView: VideoView,
        mediaUrl: String?,
        thumbnailImageView: ImageView? = null,
        thumbnailUrl: String? = null,
        placeholder: Int? = null
    ) {
        if (mediaUrl.isNullOrEmpty()) {
            videoView.visibility = View.GONE
            return
        }
        
        try {
            Log.d(TAG, "loadVideo called with URL length: ${mediaUrl.length}")
            Log.d(TAG, "URL starts with: ${mediaUrl.take(30)}...")
            
            when {
                // Base64 data URI
                mediaUrl.startsWith("data:video/") && mediaUrl.contains(";base64,") -> {
                    Log.d(TAG, "Detected base64 video data URI")
                    loadVideoFromBase64(videoView, mediaUrl)
                }
                // Regular URL
                mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://") -> {
                    Log.d(TAG, "Detected regular video URL")
                    loadVideoFromUrl(videoView, mediaUrl)
                }
                else -> {
                    Log.w(TAG, "Unsupported video format. URL preview: ${mediaUrl.take(100)}")
                    videoView.visibility = View.GONE
                    return
                }
            }
            
            // Load thumbnail if provided
            thumbnailImageView?.let { thumbView ->
                if (!thumbnailUrl.isNullOrEmpty()) {
                    loadImage(thumbView, thumbnailUrl, placeholder)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error loading video", e)
            videoView.visibility = View.GONE
        }
    }
    
    /**
     * Load image dari base64 data URI
     */
    private fun loadImageFromBase64(imageView: ImageView, dataUri: String, placeholder: Int?) {
        try {
            // Extract base64 part
            val base64Part = dataUri.substringAfter(";base64,")
            
            // Decode base64 to bitmap
            val decodedBytes = Base64.decode(base64Part, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            
            if (bitmap != null) {
                imageView.setImageBitmap(bitmap)
                Log.d(TAG, "Image loaded from base64 successfully")
            } else {
                Log.e(TAG, "Failed to decode base64 image")
                placeholder?.let { imageView.setImageResource(it) }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error loading image from base64", e)
            placeholder?.let { imageView.setImageResource(it) }
        }
    }
    
    /**
     * Load image dari URL menggunakan Glide
     */
    private fun loadImageFromUrl(imageView: ImageView, url: String, placeholder: Int?) {
        val glideRequest = Glide.with(imageView.context)
            .load(url)
            .diskCacheStrategy(DiskCacheStrategy.ALL)
        
        placeholder?.let { glideRequest.placeholder(it) }
        
        glideRequest.into(imageView)
        Log.d(TAG, "Image loaded from URL: $url")
    }
    
    /**
     * Load video dari base64 data URI
     */
    private fun loadVideoFromBase64(videoView: VideoView, dataUri: String) {
        try {
            Log.d(TAG, "Loading video from base64 data URI")
            Log.d(TAG, "Data URI length: ${dataUri.length}")
            Log.d(TAG, "Data URI preview: ${dataUri.take(100)}...")
            
            // Validate data URI format
            if (!dataUri.contains(";base64,")) {
                Log.e(TAG, "Invalid base64 data URI format - missing ;base64,")
                videoView.visibility = View.GONE
                return
            }
            
            // Extract base64 part from data URI
            val base64Part = dataUri.substringAfter(";base64,")
            Log.d(TAG, "Extracted base64 part length: ${base64Part.length}")
            
            if (base64Part.isEmpty()) {
                Log.e(TAG, "Empty base64 data after extraction")
                videoView.visibility = View.GONE
                return
            }
            
            // Decode base64 to byte array
            val decodedBytes = try {
                Base64.decode(base64Part, Base64.DEFAULT)
            } catch (e: IllegalArgumentException) {
                Log.e(TAG, "Failed to decode base64 data", e)
                videoView.visibility = View.GONE
                return
            }
            
            Log.d(TAG, "Decoded ${decodedBytes.size} bytes from base64")
            
            if (decodedBytes.isEmpty()) {
                Log.e(TAG, "Decoded bytes are empty")
                videoView.visibility = View.GONE
                return
            }
            
            // Create temporary file in cache directory
            val context = videoView.context
            val tempFile = File(context.cacheDir, "temp_video_${System.currentTimeMillis()}.mp4")
            
            // Ensure cache directory exists
            if (!context.cacheDir.exists()) {
                context.cacheDir.mkdirs()
            }
            
            // Write decoded bytes to temporary file
            try {
                tempFile.writeBytes(decodedBytes)
                Log.d(TAG, "Successfully wrote video to temp file: ${tempFile.absolutePath}")
                Log.d(TAG, "Temp file size: ${tempFile.length()} bytes")
                Log.d(TAG, "Temp file exists: ${tempFile.exists()}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to write video to temp file", e)
                videoView.visibility = View.GONE
                return
            }
            
            // Set video URI to the temporary file
            // Use FileProvider for better security and compatibility
            val uri = try {
                androidx.core.content.FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    tempFile
                )
            } catch (e: Exception) {
                Log.w(TAG, "FileProvider failed, using direct file URI", e)
                Uri.fromFile(tempFile)
            }
            
            Log.d(TAG, "Setting video URI: $uri")
            
            try {
                videoView.setVideoURI(uri)
                videoView.visibility = View.VISIBLE
                Log.d(TAG, "Video URI set successfully")
                
                // Request focus and prepare video
                videoView.requestFocus()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to set video URI", e)
                videoView.visibility = View.GONE
                // Clean up temp file
                if (tempFile.exists()) {
                    tempFile.delete()
                }
                return
            }
            
            // Setup listeners
            videoView.setOnPreparedListener { mediaPlayer ->
                Log.d(TAG, "Video prepared successfully - ready to play")
            }
            
            videoView.setOnErrorListener { _, what, extra ->
                Log.e(TAG, "VideoView error: what=$what, extra=$extra")
                // Clean up temp file on error
                try {
                    if (tempFile.exists()) {
                        tempFile.delete()
                        Log.d(TAG, "Cleaned up temp file after error")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error cleaning up temp file", e)
                }
                videoView.visibility = View.GONE
                false // Return false to show default error handling
            }
            
            videoView.setOnInfoListener { _, what, extra ->
                Log.d(TAG, "VideoView info: what=$what, extra=$extra")
                false
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error loading video from base64", e)
            videoView.visibility = View.GONE
        }
    }
    
    /**
     * Load video dari URL
     */
    private fun loadVideoFromUrl(videoView: VideoView, url: String) {
        try {
            videoView.setVideoURI(Uri.parse(url))
            videoView.visibility = View.VISIBLE
            Log.d(TAG, "Video loaded from URL: $url")
        } catch (e: Exception) {
            Log.e(TAG, "Error loading video from URL", e)
            videoView.visibility = View.GONE
        }
    }
    
    /**
     * Check if media is video type
     */
    fun isVideoType(mediaUrl: String?): Boolean {
        if (mediaUrl.isNullOrEmpty()) return false
        
        return when {
            mediaUrl.startsWith("data:video/") -> true
            mediaUrl.endsWith(".mp4", true) -> true
            mediaUrl.endsWith(".avi", true) -> true
            mediaUrl.endsWith(".mov", true) -> true
            mediaUrl.endsWith(".wmv", true) -> true
            mediaUrl.endsWith(".3gp", true) -> true
            else -> false
        }
    }
    
    /**
     * Check if media is image type
     */
    fun isImageType(mediaUrl: String?): Boolean {
        if (mediaUrl.isNullOrEmpty()) return false
        
        return when {
            mediaUrl.startsWith("data:image/") -> true
            mediaUrl.endsWith(".jpg", true) -> true
            mediaUrl.endsWith(".jpeg", true) -> true
            mediaUrl.endsWith(".png", true) -> true
            mediaUrl.endsWith(".gif", true) -> true
            mediaUrl.endsWith(".bmp", true) -> true
            mediaUrl.endsWith(".webp", true) -> true
            else -> false
        }
    }
    
    /**
     * Get media type from URL or data URI
     */
    fun getMediaType(mediaUrl: String?): String {
        return when {
            isVideoType(mediaUrl) -> "video"
            isImageType(mediaUrl) -> "image"
            else -> "unknown"
        }
    }
    
    /**
     * Clean up old temporary video files from cache directory
     * Call this method periodically to prevent cache directory from growing too large
     */
    fun cleanupTempVideoFiles(context: Context, maxAgeHours: Int = 24) {
        try {
            val cacheDir = context.cacheDir
            val currentTime = System.currentTimeMillis()
            val maxAge = maxAgeHours * 60 * 60 * 1000L // Convert hours to milliseconds
            
            val tempFiles = cacheDir.listFiles { file ->
                file.name.startsWith("temp_video_") && file.name.endsWith(".mp4")
            }
            
            tempFiles?.forEach { file ->
                val fileAge = currentTime - file.lastModified()
                if (fileAge > maxAge) {
                    if (file.delete()) {
                        Log.d(TAG, "Cleaned up old temp video file: ${file.name}")
                    }
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error cleaning up temp video files", e)
        }
    }
}
