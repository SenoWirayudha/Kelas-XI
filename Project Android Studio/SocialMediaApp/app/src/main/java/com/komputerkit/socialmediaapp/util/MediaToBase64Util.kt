package com.komputerkit.socialmediaapp.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.InputStream

/**
 * MediaToBase64Util - Utility class untuk mengkonversi media files ke base64
 * Mendukung konversi image dan video files ke base64 string dengan data URI prefix
 */
object MediaToBase64Util {
    
    private const val TAG = "MediaToBase64Util"
    
    /**
     * Konversi image Uri ke base64 string dengan data URI prefix
     * @param context Application context
     * @param imageUri Uri dari image yang dipilih
     * @param maxWidth Maximum width untuk resize (optional, default 1024)
     * @param maxHeight Maximum height untuk resize (optional, default 1024)
     * @param quality JPEG quality (0-100, default 80)
     * @return Base64 string dengan data URI prefix atau null jika gagal
     */
    fun imageUriToBase64(
        context: Context,
        imageUri: Uri,
        maxWidth: Int = 1024,
        maxHeight: Int = 1024,
        quality: Int = 80
    ): String? {
        try {
            Log.d(TAG, "Converting image URI to base64: $imageUri")
            
            // Read image from URI
            val inputStream: InputStream? = context.contentResolver.openInputStream(imageUri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (originalBitmap == null) {
                Log.e(TAG, "Failed to decode image from URI")
                return null
            }
            
            // Resize image if needed
            val resizedBitmap = resizeBitmap(originalBitmap, maxWidth, maxHeight)
            
            // Convert to base64
            val outputStream = ByteArrayOutputStream()
            resizedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            val byteArray = outputStream.toByteArray()
            outputStream.close()
            
            // Cleanup
            if (resizedBitmap != originalBitmap) {
                originalBitmap.recycle()
            }
            resizedBitmap.recycle()
            
            // Create base64 string with data URI prefix
            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            val dataUri = "data:image/jpeg;base64,$base64String"
            
            Log.d(TAG, "Image converted to base64 successfully, size: ${byteArray.size} bytes")
            return dataUri
            
        } catch (e: Exception) {
            Log.e(TAG, "Error converting image to base64", e)
            return null
        }
    }
    
    /**
     * Konversi video Uri ke base64 string dengan data URI prefix
     * @param context Application context
     * @param videoUri Uri dari video yang dipilih
     * @param maxSizeMB Maximum size in MB (default 0.7MB untuk Firestore limit)
     * @return Base64 string dengan data URI prefix atau null jika gagal
     */
    fun videoUriToBase64(
        context: Context,
        videoUri: Uri,
        maxSizeMB: Int = 1 // Reduced from 10MB to 1MB for Firestore compatibility
    ): String? {
        try {
            Log.d(TAG, "Converting video URI to base64: $videoUri")
            
            // Read video file
            val inputStream: InputStream? = context.contentResolver.openInputStream(videoUri)
            if (inputStream == null) {
                Log.e(TAG, "Failed to open video input stream")
                return null
            }
            
            // Read all bytes
            val byteArray = inputStream.readBytes()
            inputStream.close()
            
            // Firestore has 1MB document limit, base64 adds ~33% overhead
            // So we need to limit raw video to ~700KB to stay under 1MB after base64 encoding
            val maxRawSizeBytes = 700 * 1024 // 700KB raw = ~930KB base64 (under 1MB limit)
            
            if (byteArray.size > maxRawSizeBytes) {
                Log.e(TAG, "Video file too large for Firestore: ${byteArray.size} bytes (max raw: $maxRawSizeBytes bytes)")
                Log.e(TAG, "Base64 encoded size would be: ${(byteArray.size * 4 / 3)} bytes (Firestore limit: 1MB)")
                return null
            }
            
            // Get MIME type
            val mimeType = getMimeType(context, videoUri) ?: "video/mp4"
            
            // Create base64 string with data URI prefix
            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            val dataUri = "data:$mimeType;base64,$base64String"
            
            // Calculate final size for logging
            val finalSizeBytes = dataUri.toByteArray().size
            Log.d(TAG, "Video converted to base64 successfully")
            Log.d(TAG, "Raw video size: ${byteArray.size} bytes")
            Log.d(TAG, "Base64 encoded size: $finalSizeBytes bytes")
            Log.d(TAG, "Firestore document size check: ${if (finalSizeBytes < 1024 * 1024) "PASS" else "FAIL"}")
            
            return dataUri
            
        } catch (e: Exception) {
            Log.e(TAG, "Error converting video to base64", e)
            return null
        }
    }
    
    /**
     * Get video thumbnail as base64 string
     * @param context Application context
     * @param videoUri Uri dari video
     * @return Base64 string thumbnail atau null jika gagal
     */
    fun getVideoThumbnailBase64(context: Context, videoUri: Uri): String? {
        try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(context, videoUri)
            
            // Get frame at 1 second
            val bitmap = retriever.getFrameAtTime(1000000) // 1 second in microseconds
            retriever.release()
            
            if (bitmap == null) {
                Log.e(TAG, "Failed to get video thumbnail")
                return null
            }
            
            // Resize thumbnail
            val thumbnailBitmap = resizeBitmap(bitmap, 300, 300)
            
            // Convert to base64
            val outputStream = ByteArrayOutputStream()
            thumbnailBitmap.compress(Bitmap.CompressFormat.JPEG, 70, outputStream)
            val byteArray = outputStream.toByteArray()
            outputStream.close()
            
            // Cleanup
            if (thumbnailBitmap != bitmap) {
                bitmap.recycle()
            }
            thumbnailBitmap.recycle()
            
            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            return "data:image/jpeg;base64,$base64String"
            
        } catch (e: Exception) {
            Log.e(TAG, "Error getting video thumbnail", e)
            return null
        }
    }
    
    /**
     * Resize bitmap to fit within max dimensions while preserving aspect ratio
     */
    private fun resizeBitmap(original: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val width = original.width
        val height = original.height
        
        if (width <= maxWidth && height <= maxHeight) {
            return original
        }
        
        val ratio = minOf(maxWidth.toFloat() / width, maxHeight.toFloat() / height)
        val newWidth = (width * ratio).toInt()
        val newHeight = (height * ratio).toInt()
        
        return Bitmap.createScaledBitmap(original, newWidth, newHeight, true)
    }
    
    /**
     * Get MIME type from URI
     */
    private fun getMimeType(context: Context, uri: Uri): String? {
        return context.contentResolver.getType(uri)
    }
    
    /**
     * Check if the provided string is a valid base64 data URI
     */
    fun isValidBase64DataUri(dataUri: String): Boolean {
        return dataUri.startsWith("data:") && dataUri.contains(";base64,")
    }
    
    /**
     * Extract MIME type from data URI
     */
    fun getMimeTypeFromDataUri(dataUri: String): String? {
        if (!isValidBase64DataUri(dataUri)) return null
        
        val start = dataUri.indexOf("data:") + 5
        val end = dataUri.indexOf(";base64,")
        
        return if (start < end) {
            dataUri.substring(start, end)
        } else null
    }
}
