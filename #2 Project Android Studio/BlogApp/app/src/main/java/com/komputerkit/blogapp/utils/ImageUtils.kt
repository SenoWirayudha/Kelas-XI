package com.komputerkit.blogapp.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import java.io.InputStream

object ImageUtils {
    
    fun uriToBase64(context: Context, uri: Uri, maxSize: Int = 1024): String? {
        return try {
            Log.d("ImageUtils", "Converting URI to base64: $uri")
            val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (bitmap == null) {
                Log.e("ImageUtils", "Failed to decode bitmap from URI")
                return null
            }
            
            Log.d("ImageUtils", "Original bitmap size: ${bitmap.width}x${bitmap.height}")
            
            // Rotate image if needed
            val rotatedBitmap = rotateImageIfRequired(context, bitmap, uri)
            
            // Resize image
            val resizedBitmap = resizeBitmap(rotatedBitmap, maxSize)
            Log.d("ImageUtils", "Resized bitmap size: ${resizedBitmap.width}x${resizedBitmap.height}")
            
            // Convert to base64
            val base64 = bitmapToBase64(resizedBitmap)
            Log.d("ImageUtils", "Base64 conversion successful, length: ${base64.length}")
            base64
        } catch (e: Exception) {
            Log.e("ImageUtils", "Error converting URI to base64", e)
            e.printStackTrace()
            null
        }
    }
    
    fun base64ToBitmap(base64String: String): Bitmap? {
        return try {
            Log.d("ImageUtils", "Converting base64 to bitmap, length: ${base64String.length}")
            val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
            Log.d("ImageUtils", "Decoded bytes length: ${decodedBytes.size}")
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            if (bitmap != null) {
                Log.d("ImageUtils", "Bitmap created successfully: ${bitmap.width}x${bitmap.height}")
            } else {
                Log.e("ImageUtils", "Failed to create bitmap from decoded bytes")
            }
            bitmap
        } catch (e: Exception) {
            Log.e("ImageUtils", "Error converting base64 to bitmap", e)
            e.printStackTrace()
            null
        }
    }
    
    private fun bitmapToBase64(bitmap: Bitmap, quality: Int = 80): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.DEFAULT)
    }
    
    private fun resizeBitmap(bitmap: Bitmap, maxSize: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        if (width <= maxSize && height <= maxSize) {
            return bitmap
        }
        
        val aspectRatio = width.toFloat() / height.toFloat()
        
        val newWidth: Int
        val newHeight: Int
        
        if (width > height) {
            newWidth = maxSize
            newHeight = (maxSize / aspectRatio).toInt()
        } else {
            newHeight = maxSize
            newWidth = (maxSize * aspectRatio).toInt()
        }
        
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
    
    private fun rotateImageIfRequired(context: Context, bitmap: Bitmap, uri: Uri): Bitmap {
        try {
            val inputStream = context.contentResolver.openInputStream(uri)
            val exif = inputStream?.let { ExifInterface(it) }
            inputStream?.close()
            
            val orientation = exif?.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            ) ?: ExifInterface.ORIENTATION_NORMAL
            
            return when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90 -> rotateImage(bitmap, 90f)
                ExifInterface.ORIENTATION_ROTATE_180 -> rotateImage(bitmap, 180f)
                ExifInterface.ORIENTATION_ROTATE_270 -> rotateImage(bitmap, 270f)
                else -> bitmap
            }
        } catch (e: Exception) {
            return bitmap
        }
    }
    
    private fun rotateImage(bitmap: Bitmap, degree: Float): Bitmap {
        val matrix = Matrix()
        matrix.postRotate(degree)
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }
}
