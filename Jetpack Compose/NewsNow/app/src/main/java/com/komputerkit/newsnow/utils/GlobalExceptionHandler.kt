package com.komputerkit.newsnow.utils

import android.content.Context
import kotlin.system.exitProcess

class GlobalExceptionHandler(
    private val context: Context,
    private val defaultHandler: Thread.UncaughtExceptionHandler?
) : Thread.UncaughtExceptionHandler {
    
    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        try {
            // Log crash
            Logger.e("UNCAUGHT EXCEPTION", throwable)
            
            // Save crash log untuk debugging
            saveCrashLog(throwable)
            
            // Tampilkan error dialog (optional - untuk production bisa dihapus)
            // showCrashDialog(throwable)
            
        } catch (e: Exception) {
            Logger.e("Error in exception handler", e)
        } finally {
            // Call default handler
            defaultHandler?.uncaughtException(thread, throwable)
            
            // Terminate app
            exitProcess(1)
        }
    }
    
    private fun saveCrashLog(throwable: Throwable) {
        try {
            val crashInfo = buildString {
                appendLine("=== CRASH REPORT ===")
                appendLine("Timestamp: ${System.currentTimeMillis()}")
                appendLine("Thread: ${Thread.currentThread().name}")
                appendLine("Message: ${throwable.message}")
                appendLine("\nStack Trace:")
                appendLine(throwable.stackTraceToString())
                
                throwable.cause?.let { cause ->
                    appendLine("\nCaused by:")
                    appendLine(cause.stackTraceToString())
                }
            }
            
            Logger.e("Crash Log:\n$crashInfo")
            
            // Optionally save to file atau send ke crash analytics service
            // saveCrashToFile(context, crashInfo)
            
        } catch (e: Exception) {
            Logger.e("Failed to save crash log", e)
        }
    }
    
    companion object {
        fun install(context: Context) {
            val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
            val customHandler = GlobalExceptionHandler(context, defaultHandler)
            Thread.setDefaultUncaughtExceptionHandler(customHandler)
            
            Logger.i("Global exception handler installed")
        }
    }
}