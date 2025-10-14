package com.komputerkit.newsnow.utils

import android.util.Log

object Logger {
    
    private const val TAG = "NewsNow"
    private var isDebugMode = true // Set false untuk production
    
    /**
     * Log debug message
     */
    fun d(message: String, tag: String = TAG) {
        if (isDebugMode) {
            Log.d(tag, message)
        }
    }
    
    /**
     * Log info message
     */
    fun i(message: String, tag: String = TAG) {
        if (isDebugMode) {
            Log.i(tag, message)
        }
    }
    
    /**
     * Log warning message
     */
    fun w(message: String, tag: String = TAG) {
        Log.w(tag, message)
    }
    
    /**
     * Log error message
     */
    fun e(message: String, throwable: Throwable? = null, tag: String = TAG) {
        if (throwable != null) {
            Log.e(tag, message, throwable)
        } else {
            Log.e(tag, message)
        }
    }
    
    /**
     * Log API call
     */
    fun logApiCall(endpoint: String, method: String = "GET") {
        d("API Call: $method $endpoint")
    }
    
    /**
     * Log API response
     */
    fun logApiResponse(endpoint: String, success: Boolean, message: String? = null) {
        val status = if (success) "SUCCESS" else "FAILED"
        d("API Response: $endpoint - $status${message?.let { " - $it" } ?: ""}")
    }
    
    /**
     * Log navigation event
     */
    fun logNavigation(destination: String) {
        d("Navigation: -> $destination")
    }
    
    /**
     * Log user action
     */
    fun logUserAction(action: String, details: String? = null) {
        d("User Action: $action${details?.let { " - $it" } ?: ""}")
    }
    
    /**
     * Set debug mode
     */
    fun setDebugMode(enabled: Boolean) {
        isDebugMode = enabled
    }
}