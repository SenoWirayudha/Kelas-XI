package com.komputerkit.socialmediaapp.util

import android.content.Context
import android.widget.Toast

/**
 * Debug utility for video troubleshooting without logcat
 */
object VideoDebugUtil {
    
    // Set to false in production
    private const val DEBUG_MODE = true
    
    fun showDebugToast(context: Context, message: String) {
        if (DEBUG_MODE) {
            Toast.makeText(context, "DEBUG: $message", Toast.LENGTH_SHORT).show()
        }
    }
    
    fun showDebugInfo(context: Context, title: String, details: String) {
        if (DEBUG_MODE) {
            Toast.makeText(context, "$title\n$details", Toast.LENGTH_LONG).show()
        }
    }
    
    fun showVideoState(context: Context, width: Int, height: Int, visible: Boolean) {
        if (DEBUG_MODE) {
            val visibility = if (visible) "VISIBLE" else "HIDDEN"
            showDebugToast(context, "Video: ${width}x${height} ($visibility)")
        }
    }
}