package com.komputerkit.socialmediaapp.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.ByteArrayOutputStream

/**
 * Convert Bitmap to Base64 string with data URI format
 */
fun bitmapToBase64(bitmap: Bitmap, quality: Int = 80): String {
    val outputStream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
    val byteArray = outputStream.toByteArray()
    val base64String = Base64.encodeToString(byteArray, Base64.DEFAULT)
    return "data:image/jpeg;base64,$base64String"
}

/**
 * Convert Base64 data URI string to Bitmap
 */
fun String.base64ToBitmap(): Bitmap? {
    return try {
        // Remove data URI prefix if present
        val base64String = if (this.startsWith("data:image")) {
            this.substring(this.indexOf(",") + 1)
        } else {
            this
        }
        
        val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}
