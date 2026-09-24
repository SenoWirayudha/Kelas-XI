package com.komputerkit.moview.util

import android.os.Build
import com.komputerkit.moview.BuildConfig

/**
 * Central server configuration.
 *
 * Priority:
 * 1. NGROK_URL (dari local.properties / gradle) -> https://xxxx.ngrok-free.app
 *    Cocok untuk HP fisik tanpa adb reverse / demo. Kosongkan untuk fallback.
 * 2. Emulator       → 10.0.2.2  (Android emulator alias for host loopback)
 * 3. Physical (USB) → 127.0.0.1 (requires: adb reverse tcp:8000 tcp:8000)
 *
 * Jadi setelah setup ngrok, adb reverse TETAP bisa dipakai — tinggal
 * kosongkan NGROK_URL di local.properties lalu Sync + Rebuild.
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

    /** Trimmed NGROK_URL dari BuildConfig, tanpa trailing slash */
    private val ngrokUrl: String = BuildConfig.NGROK_URL.trim().trimEnd('/')

    /** true kalau NGROK_URL diisi di local.properties / gradle */
    val isNgrok: Boolean = ngrokUrl.isNotEmpty()

    /** Emulator → 10.0.2.2 | Physical USB → 127.0.0.1 (via adb reverse) | Ngrok → host ngrok */
    val HOST: String = when {
        isNgrok -> ngrokUrl.removePrefix("https://").removePrefix("http://").substringBefore("/")
        isEmulator -> "10.0.2.2"
        else -> "127.0.0.1"
    }

    /** http://HOST:8000/api/v1/  atau  https://xxx.ngrok-free.app/api/v1/ */
    val BASE_URL: String = if (isNgrok) "$ngrokUrl/api/v1/" else "http://$HOST:8000/api/v1/"

    /** http://HOST:8000/storage/  atau  https://xxx.ngrok-free.app/storage/ */
    val STORAGE_URL: String = if (isNgrok) "$ngrokUrl/storage/" else "http://$HOST:8000/storage/"

    /**
     * Rewrites any "127.0.0.1" / "10.0.2.2" / "localhost" in a URL to current host.
     * Kalau pakai ngrok, sekalian ganti http://127.0.0.1:8000 -> https://xxx.ngrok-free.app
     * supaya image URL dari backend tidak broken.
     */
    fun fixUrl(url: String): String {
        if (isNgrok) {
            return url
                .replace("http://127.0.0.1:8000", ngrokUrl)
                .replace("http://10.0.2.2:8000", ngrokUrl)
                .replace("http://localhost:8000", ngrokUrl)
                .replace("127.0.0.1", HOST)
                .replace("10.0.2.2", HOST)
        }
        return url.replace("127.0.0.1", HOST).replace("10.0.2.2", HOST)
    }

    /** Resolve a relative-or-absolute media path to a full URL. */
    fun resolveStorageUrl(path: String?): String {
        if (path.isNullOrBlank()) return ""
        return if (path.startsWith("http")) fixUrl(path) else "$STORAGE_URL$path"
    }
}
