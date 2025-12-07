package com.komputerkit.newsnow.utils

import kotlinx.coroutines.delay
import kotlin.math.pow

object RetryUtils {
    
    /**
     * Retry mechanism dengan exponential backoff
     * @param times Jumlah percobaan (default: 3)
     * @param initialDelay Delay awal dalam ms (default: 1000ms)
     * @param maxDelay Max delay dalam ms (default: 10000ms)
     * @param factor Faktor eksponensial (default: 2.0)
     * @param block Lambda yang akan di-retry
     */
    suspend fun <T> retryWithExponentialBackoff(
        times: Int = 3,
        initialDelay: Long = 1000L,
        maxDelay: Long = 10000L,
        factor: Double = 2.0,
        block: suspend () -> T
    ): T {
        var currentDelay = initialDelay
        var lastException: Exception? = null
        
        repeat(times - 1) { attempt ->
            try {
                return block()
            } catch (e: Exception) {
                lastException = e
                
                // Log untuk debugging
                println("Retry attempt ${attempt + 1} failed: ${e.message}")
                
                // Don't retry pada error tertentu (4xx client errors)
                if (e is RetryException && !e.shouldRetry) {
                    throw e
                }
                
                delay(currentDelay.coerceAtMost(maxDelay))
                currentDelay = (currentDelay * factor).toLong()
            }
        }
        
        // Last attempt tanpa retry
        try {
            return block()
        } catch (e: Exception) {
            // Throw last exception jika masih gagal
            throw lastException ?: e
        }
    }
    
    /**
     * Simple retry untuk operasi yang tidak memerlukan backoff
     */
    suspend fun <T> retry(
        times: Int = 3,
        delay: Long = 1000L,
        block: suspend () -> T
    ): T {
        repeat(times - 1) {
            try {
                return block()
            } catch (e: Exception) {
                delay(delay)
            }
        }
        return block() // Last attempt
    }
}

/**
 * Custom exception untuk control retry behavior
 */
class RetryException(
    message: String,
    val shouldRetry: Boolean = true,
    cause: Throwable? = null
) : Exception(message, cause)