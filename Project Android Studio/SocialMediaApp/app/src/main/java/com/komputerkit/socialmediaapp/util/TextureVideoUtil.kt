package com.komputerkit.socialmediaapp.util

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.util.Base64
import android.util.Log
import android.view.Surface
import android.view.TextureView
import android.view.View
import java.io.File
import java.io.FileOutputStream

/**
 * Alternative video player using TextureView for better rendering
 */
object TextureVideoUtil {
    
    private const val TAG = "TextureVideoUtil"
    
    /**
     * Load video using TextureView + MediaPlayer for better visual rendering
     */
    fun loadVideoWithTexture(textureView: TextureView, base64Data: String): Boolean {
        return try {
            Log.d(TAG, "Loading video with TextureView")
            
            // Extract and decode base64
            val base64Content = if (base64Data.startsWith("data:")) {
                base64Data.substringAfter(";base64,")
            } else {
                base64Data
            }
            
            val decodedBytes = Base64.decode(base64Content, Base64.DEFAULT)
            
            // Create temp file
            val context = textureView.context
            val tempDir = File(context.cacheDir, "videos")
            if (!tempDir.exists()) tempDir.mkdirs()
            
            val tempFile = File(tempDir, "texture_video_${System.currentTimeMillis()}.mp4")
            FileOutputStream(tempFile).use { it.write(decodedBytes) }
            
            Log.d(TAG, "Temp file created for TextureView: ${tempFile.absolutePath}")
            
            // Setup TextureView
            textureView.visibility = View.VISIBLE
            textureView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
                override fun onSurfaceTextureAvailable(surface: android.graphics.SurfaceTexture, width: Int, height: Int) {
                    Log.d(TAG, "TextureView surface available: ${width}x${height}")
                    setupMediaPlayer(textureView, tempFile, Surface(surface))
                }
                
                override fun onSurfaceTextureSizeChanged(surface: android.graphics.SurfaceTexture, width: Int, height: Int) {
                    Log.d(TAG, "TextureView surface size changed: ${width}x${height}")
                }
                
                override fun onSurfaceTextureDestroyed(surface: android.graphics.SurfaceTexture): Boolean {
                    Log.d(TAG, "TextureView surface destroyed")
                    cleanupTempFile(tempFile)
                    return true
                }
                
                override fun onSurfaceTextureUpdated(surface: android.graphics.SurfaceTexture) {
                    // Video frame updated - rendering is working
                }
            }
            
            true
            
        } catch (e: Exception) {
            Log.e(TAG, "Error loading video with TextureView", e)
            false
        }
    }
    
    private fun setupMediaPlayer(textureView: TextureView, videoFile: File, surface: Surface) {
        try {
            val mediaPlayer = MediaPlayer().apply {
                setDataSource(videoFile.absolutePath)
                setSurface(surface)
                
                setOnPreparedListener { mp ->
                    Log.d(TAG, "MediaPlayer prepared for TextureView")
                    Log.d(TAG, "Video size: ${mp.videoWidth}x${mp.videoHeight}")
                    
                    // Show first frame
                    mp.seekTo(100)
                    
                    VideoDebugUtil.showDebugToast(textureView.context,
                        "Texture video ready: ${mp.videoWidth}x${mp.videoHeight}")
                }
                
                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                    false
                }
                
                setOnVideoSizeChangedListener { _, width, height ->
                    Log.d(TAG, "Video size changed: ${width}x${height}")
                }
                
                prepareAsync()
            }
            
            // Store MediaPlayer reference in TextureView tag for later control
            textureView.tag = mediaPlayer
            
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up MediaPlayer", e)
        }
    }
    
    /**
     * Control video playback on TextureView
     */
    fun togglePlayback(textureView: TextureView): Boolean {
        return try {
            val mediaPlayer = textureView.tag as? MediaPlayer
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying) {
                    mediaPlayer.pause()
                    Log.d(TAG, "Video paused")
                    false
                } else {
                    mediaPlayer.start()
                    Log.d(TAG, "Video started")
                    true
                }
            } else {
                Log.w(TAG, "No MediaPlayer found for TextureView")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error controlling video playback", e)
            false
        }
    }
    
    /**
     * Release MediaPlayer resources
     */
    fun releasePlayer(textureView: TextureView) {
        try {
            val mediaPlayer = textureView.tag as? MediaPlayer
            mediaPlayer?.release()
            textureView.tag = null
            Log.d(TAG, "MediaPlayer released")
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing MediaPlayer", e)
        }
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