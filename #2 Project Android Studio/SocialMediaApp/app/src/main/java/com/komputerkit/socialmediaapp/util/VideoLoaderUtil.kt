package com.komputerkit.socialmediaapp.util

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Base64
import android.util.Log
import android.view.View
import android.widget.ImageView
import android.widget.VideoView
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileDescriptor
import java.io.FileOutputStream

/**
 * Alternative video loader utility with better base64 support
 */
object VideoLoaderUtil {
    
    private const val TAG = "VideoLoaderUtil"
    
    /**
     * Load video from base64 string with better error handling
     */
    fun loadVideoFromBase64(videoView: VideoView, base64Data: String): Boolean {
        return try {
            Log.d(TAG, "Starting loadVideoFromBase64")
            Log.d(TAG, "Base64 data length: ${base64Data.length}")
            
            // Validate input
            if (base64Data.isEmpty()) {
                Log.e(TAG, "Empty base64 data")
                return false
            }
            
            // Extract base64 content
            val base64Content = if (base64Data.startsWith("data:")) {
                if (base64Data.contains(";base64,")) {
                    base64Data.substringAfter(";base64,")
                } else {
                    Log.e(TAG, "Invalid data URI format")
                    return false
                }
            } else {
                base64Data
            }
            
            Log.d(TAG, "Extracted base64 content length: ${base64Content.length}")
            
            // Decode base64
            val decodedBytes = try {
                Base64.decode(base64Content, Base64.DEFAULT)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to decode base64", e)
                return false
            }
            
            Log.d(TAG, "Decoded bytes length: ${decodedBytes.size}")
            
            // Create temp file
            val context = videoView.context
            val tempDir = File(context.cacheDir, "videos")
            if (!tempDir.exists()) {
                tempDir.mkdirs()
            }
            
            val tempFile = File(tempDir, "video_${System.currentTimeMillis()}.mp4")
            
            // Write to file
            FileOutputStream(tempFile).use { fos ->
                fos.write(decodedBytes)
                fos.flush()
            }
            
            Log.d(TAG, "Temp file created: ${tempFile.absolutePath}")
            Log.d(TAG, "Temp file size: ${tempFile.length()}")
            
            // Set to VideoView
            val uri = Uri.fromFile(tempFile)
            Log.d(TAG, "Setting VideoView URI: $uri")
            
            videoView.setVideoURI(uri)
            videoView.visibility = View.VISIBLE
            
            // Log VideoView state
            Log.d(TAG, "VideoView visibility set to VISIBLE")
            Log.d(TAG, "VideoView width: ${videoView.width}, height: ${videoView.height}")
            Log.d(TAG, "VideoView layoutParams: ${videoView.layoutParams}")
            
            // Request focus and prepare
            videoView.requestFocus()
            
            // Force VideoView surface creation and setup
            try {
                Log.d(TAG, "Starting video preparation...")
                
                // Force create surface holder for video rendering
                videoView.setZOrderOnTop(false) // Ensure proper layering
                videoView.setZOrderMediaOverlay(false)
                
                // Reset and resume to ensure proper state
                videoView.suspend()
                videoView.resume()
                
                // Force surface creation
                videoView.invalidate()
                
            } catch (e: Exception) {
                Log.w(TAG, "Error during video preparation", e)
            }
            
            // Setup listeners with detailed logging
            videoView.setOnPreparedListener { mediaPlayer ->
                Log.d(TAG, "VideoView onPrepared - video is ready to play")
                Log.d(TAG, "Video duration: ${mediaPlayer.duration}ms")
                Log.d(TAG, "Video width: ${mediaPlayer.videoWidth}, height: ${mediaPlayer.videoHeight}")
                
                // Ensure VideoView is properly sized and visible
                videoView.visibility = View.VISIBLE
                
                // Force layout update with proper dimensions
                val layoutParams = videoView.layoutParams
                if (layoutParams.height <= 0) {
                    layoutParams.height = 250 // Set minimum height if not set
                    videoView.layoutParams = layoutParams
                }
                
                // Request layout and invalidate to force redraw
                videoView.requestLayout()
                videoView.invalidate()
                
                // Start the video to show content immediately
                mediaPlayer.start()
                
                // Seek to first frame and pause to show thumbnail
                mediaPlayer.seekTo(100) // Seek to 100ms
                mediaPlayer.pause()
                
                Log.d(TAG, "VideoView prepared and content should be visible")
                
                // Show debug info
                VideoDebugUtil.showDebugToast(videoView.context, 
                    "Video ready: ${mediaPlayer.videoWidth}x${mediaPlayer.videoHeight}")
            }
            
            videoView.setOnInfoListener { _, what, extra ->
                Log.d(TAG, "VideoView onInfo - what: $what, extra: $extra")
                false
            }
            
            // Setup cleanup
            videoView.setOnCompletionListener {
                Log.d(TAG, "VideoView onCompletion - video finished playing")
                cleanupTempFile(tempFile)
            }
            
            videoView.setOnErrorListener { _, what, extra ->
                Log.e(TAG, "VideoView onError - what: $what, extra: $extra")
                
                // Show toast for error feedback
                android.widget.Toast.makeText(videoView.context, 
                    "Video error: $what", 
                    android.widget.Toast.LENGTH_LONG).show()
                    
                cleanupTempFile(tempFile)
                false
            }
            
            Log.d(TAG, "Video loaded successfully - all listeners configured")
            
            // Debug feedback
            VideoDebugUtil.showDebugToast(context, "Video file created: ${tempFile.length()} bytes")
            
            true
            
        } catch (e: Exception) {
            Log.e(TAG, "Error in loadVideoFromBase64", e)
            false
        }
    }
    
    /**
     * Generate video thumbnail from base64
     */
    fun generateThumbnailFromBase64(context: Context, base64Data: String): Bitmap? {
        return try {
            Log.d(TAG, "Generating thumbnail from base64 data")
            
            // Use the same temp file approach
            val base64Content = if (base64Data.startsWith("data:")) {
                base64Data.substringAfter(";base64,")
            } else {
                base64Data
            }
            
            val decodedBytes = Base64.decode(base64Content, Base64.DEFAULT)
            val tempFile = File(context.cacheDir, "thumb_${System.currentTimeMillis()}.mp4")
            
            tempFile.writeBytes(decodedBytes)
            
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(tempFile.absolutePath)
            val bitmap = retriever.getFrameAtTime(1000) // First frame
            retriever.release()
            
            // Cleanup
            tempFile.delete()
            
            Log.d(TAG, "Thumbnail generated successfully")
            bitmap
        } catch (e: Exception) {
            Log.e(TAG, "Error generating thumbnail", e)
            null
        }
    }
    
    /**
     * Load video with fallback to thumbnail if VideoView fails
     */
    fun loadVideoWithFallback(videoView: VideoView, imageView: ImageView, base64Data: String): Boolean {
        Log.d(TAG, "Loading video with fallback mechanism")
        
        val videoSuccess = loadVideoFromBase64(videoView, base64Data)
        
        if (!videoSuccess) {
            Log.w(TAG, "Video loading failed, trying thumbnail fallback")
            
            // Hide video view and show image with thumbnail
            videoView.visibility = View.GONE
            
            val thumbnail = generateThumbnailFromBase64(videoView.context, base64Data)
            if (thumbnail != null) {
                imageView.setImageBitmap(thumbnail)
                imageView.visibility = View.VISIBLE
                Log.d(TAG, "Thumbnail fallback successful")
                return true
            } else {
                Log.e(TAG, "Both video and thumbnail loading failed")
                return false
            }
        }
        
        // Hide image view when video is successful
        imageView.visibility = View.GONE
        return true
    }
    
    private fun cleanupTempFile(file: File) {
        try {
            if (file.exists()) {
                file.delete()
                Log.d(TAG, "Cleaned up temp file: ${file.name}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error cleaning up temp file", e)
        }
    }
}