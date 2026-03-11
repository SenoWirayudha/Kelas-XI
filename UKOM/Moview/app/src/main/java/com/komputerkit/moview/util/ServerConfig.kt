package com.komputerkit.moview.util

import android.os.Build

/**
 * Central server configuration.
 *
 * Emulator       → 10.0.2.2  (Android emulator alias for host loopback)
 * Physical (USB) → 127.0.0.1 (requires: adb reverse tcp:8000 tcp:8000)
 */
object ServerConfig {

    private val isEmulator: Boolean by lazy {
        Build.FINGERPRINT.contains("generic")
                || Build.FINGERPRINT.contains("emulator")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk")
                || Build.PRODUCT.contains("emulator")
    }

    /** Emulator → 10.0.2.2 | Physical USB → 127.0.0.1 (via adb reverse) */
    val HOST: String = if (isEmulator) "10.0.2.2" else "127.0.0.1"

    /** http://HOST:8000/api/v1/ */
    val BASE_URL: String = "http://$HOST:8000/api/v1/"

    /** http://HOST:8000/storage/ */
    val STORAGE_URL: String = "http://$HOST:8000/storage/"

    /** Rewrites any "127.0.0.1" in a URL to the correct host. */
    fun fixUrl(url: String): String =
        url.replace("127.0.0.1", HOST).replace("10.0.2.2", HOST)

    /** Resolve a relative-or-absolute media path to a full URL. */
    fun resolveStorageUrl(path: String?): String {
        if (path.isNullOrBlank()) return ""
        return if (path.startsWith("http")) fixUrl(path) else "$STORAGE_URL$path"
    }
}
