package com.komputerkit.blogapp.utils

import android.util.Log

object DebugLogger {
    private const val TAG = "BlogApp"
    
    fun logNavigation(from: String, to: String, args: String = "") {
        Log.d(TAG, "Navigation: $from -> $to ${if (args.isNotEmpty()) "with args: $args" else ""}")
    }
    
    fun logError(location: String, error: Throwable) {
        Log.e(TAG, "Error in $location: ${error.message}", error)
    }
    
    fun logPostData(location: String, post: Any?) {
        Log.d(TAG, "Post data in $location: $post")
    }
    
    fun logUserAction(action: String, details: String = "") {
        Log.d(TAG, "User action: $action ${if (details.isNotEmpty()) "- $details" else ""}")
    }
}
