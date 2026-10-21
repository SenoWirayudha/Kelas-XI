package com.komputerkit.moview.ui.auth

import android.content.Context

/**
 * Local persistence for an in-flight OTP verification (register flow).
 *
 * Stores ONLY routing metadata — never the OTP code itself — so the app can
 * bounce the user straight back to the OTP screen after a process death or
 * while they hop to the email app and return. All times are absolute epoch
 * millis so countdowns stay correct across background/foreground transitions
 * and process restarts (a relative counter would reset to full on relaunch).
 */
object OtpStateStore {

    private const val PREFS = "MoviewOtpPrefs"
    private const val KEY_EMAIL = "otp_email"
    private const val KEY_FLOW = "otp_flow"
    private const val KEY_EXPIRES_AT = "otp_expires_at"
    private const val KEY_RESEND_AVAILABLE_AT = "otp_resend_available_at"

    /** Client-side estimate of OTP validity — the backend exposes no expiry. */
    private const val OTP_TTL_MILLIS = 5 * 60 * 1000L

    /** Server-enforced cooldown between resends. */
    const val RESEND_COOLDOWN_MILLIS = 60_000L

    data class OtpState(
        val email: String,
        val flow: String,
        val expiresAt: Long,
        val resendAvailableAt: Long
    )

    /**
     * Persists a fresh verification. Called once when the OTP screen is first
     * opened for an email (not on configuration changes, which would otherwise
     * reset the cooldown/expiry timestamps).
     */
    fun save(context: Context, email: String, flow: String) {
        val now = System.currentTimeMillis()
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(KEY_EMAIL, email)
            .putString(KEY_FLOW, flow)
            .putLong(KEY_EXPIRES_AT, now + OTP_TTL_MILLIS)
            .putLong(KEY_RESEND_AVAILABLE_AT, now + RESEND_COOLDOWN_MILLIS)
            .apply()
    }

    /** Re-arms the resend cooldown after a successful resend. */
    fun markResendSent(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong(KEY_RESEND_AVAILABLE_AT, System.currentTimeMillis() + RESEND_COOLDOWN_MILLIS)
            .apply()
    }

    /** Raw read with no side effects — used for countdown math. */
    fun peek(context: Context): OtpState? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val email = prefs.getString(KEY_EMAIL, null)?.takeIf { it.isNotEmpty() } ?: return null
        return OtpState(
            email = email,
            flow = prefs.getString(KEY_FLOW, "register") ?: "register",
            expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L),
            resendAvailableAt = prefs.getLong(KEY_RESEND_AVAILABLE_AT, 0L)
        )
    }

    /**
     * Expiry-aware read: returns the pending state only while it is still
     * valid, clearing it (and returning null) once expired or absent.
     */
    fun getValid(context: Context): OtpState? {
        val state = peek(context) ?: return null
        if (System.currentTimeMillis() > state.expiresAt) {
            clear(context)
            return null
        }
        return state
    }

    /** Wipes the pending verification (success, cancel, expiry, logout). */
    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .remove(KEY_EMAIL)
            .remove(KEY_FLOW)
            .remove(KEY_EXPIRES_AT)
            .remove(KEY_RESEND_AVAILABLE_AT)
            .apply()
    }
}
