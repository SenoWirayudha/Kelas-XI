package com.komputerkit.moview.util

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.json.JSONObject
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.util.concurrent.CancellationException

/**
 * Central mapping from API/network failures to user-facing Indonesian text.
 *
 * Backend facts (routes/api.php v1):
 *  - login      401 "Invalid email or password" (wrong email AND wrong password
 *                return the same message, so the UI must not guess a column)
 *  - register   409 "Email already registered" / "Username already taken"
 *  - validation 422 { success:false, message:"Validation failed", errors:{...} }
 *  - throttles  429
 */
object ErrorMessage {

    const val NO_INTERNET = "Tidak ada koneksi internet. Periksa jaringanmu lalu coba lagi."
    const val SERVER_BUSY = "Server sedang sibuk. Coba lagi sebentar lagi."
    const val TOO_MANY_TRIES = "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."

    /** Backend English message → Indonesian UI text. */
    private val SERVER_MAP = listOf(
        "Invalid email or password" to "Email atau password salah",
        "Email already registered" to "Email sudah terdaftar",
        "Username already taken" to "Username sudah dipakai",
        "The password field must be at least 6 characters" to "Password minimal 6 karakter",
        "Validation failed" to "Periksa kembali isianmu",
    )

    fun mapServerMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        SERVER_MAP.forEach { (needle, indonesian) ->
            if (raw.contains(needle, ignoreCase = true)) return indonesian
        }
        return null
    }

    /** Raw backend `message` from an HttpException's error body, or the wrapped
     *  Exception message when the repository rethrew a non-HTTP failure.
     *  Returns null for network-level exceptions (no backend message exists). */
    fun serverMessageRaw(t: Throwable?): String? = when (t) {
        is HttpException -> parseErrorBody(t)
        is IOException -> null
        else -> t?.message?.takeIf {
            it.isNotBlank() && !it.startsWith("HTTP ") && !it.contains("cancel", ignoreCase = true)
        }
    }

    fun codeOf(t: Throwable?): Int? = (t as? HttpException)?.code()

    /**
     * Maps a failure for screens that handle their own errors (auth forms etc.).
     * Returns null when the user has already been told globally via [ErrorBus]
     * (no internet / timeout / 5xx) or when the coroutine was cancelled — callers
     * should simply not show anything in that case.
     */
    fun fromApi(t: Throwable?, fallback: String): String? = when {
        t is CancellationException -> null
        t is SocketTimeoutException -> null // ErrorBus posts SERVER_BUSY
        t is UnknownHostException -> null   // ErrorBus posts NO_INTERNET
        t is IOException -> null            // ErrorBus posts NO_INTERNET
        t is HttpException && t.code() == 429 -> TOO_MANY_TRIES
        t is HttpException && t.code() >= 500 -> null // ErrorBus posts SERVER_BUSY
        t is HttpException -> {
            val raw = parseErrorBody(t)
            mapServerMessage(raw) ?: raw ?: fallback
        }
        else -> {
            val raw = serverMessageRaw(t)
            mapServerMessage(raw) ?: raw ?: fallback
        }
    }

    private fun parseErrorBody(t: HttpException): String? = try {
        val body = t.response()?.errorBody()?.string()
        if (body.isNullOrBlank()) null
        else JSONObject(body).optString("message").takeIf { it.isNotBlank() }
    } catch (_: Exception) {
        null
    }
}

/**
 * Global channel for failures that repositories swallow (MovieRepository returns
 * empty/null on every error, so list/detail screens would otherwise fail
 * silently). The OkHttp interceptor in RetrofitClient posts here; MainActivity
 * collects and shows one Snackbar. Deduplicates identical messages for 2.5s so
 * a page firing several parallel requests produces a single snackbar.
 */
object ErrorBus {

    private val _messages = MutableSharedFlow<String>(
        replay = 0,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val messages = _messages.asSharedFlow()

    @Volatile private var lastMessage: String? = null
    @Volatile private var lastAt = 0L

    fun post(message: String) {
        val now = System.currentTimeMillis()
        if (message == lastMessage && now - lastAt < 2_500L) return
        lastMessage = message
        lastAt = now
        _messages.tryEmit(message)
    }
}
