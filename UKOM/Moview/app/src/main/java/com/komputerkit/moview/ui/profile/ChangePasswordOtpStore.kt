package com.komputerkit.moview.ui.profile

import android.content.Context

/**
 * Local persistence for the inline "Ganti Password" OTP.
 *
 * Stores ONLY absolute timestamps (expiry + resend availability) — never the
 * password or the OTP code — so the section can reopen with a correct
 * countdown after a process death or an email-app round-trip. A relative
 * counter would reset to full on relaunch; absolute epochs do not.
 */
object ChangePasswordOtpStore {

    private const val PREFS = "MoviewChangePwPrefs"
    private const val KEY_EXPIRES_AT = "cp_otp_expires_at"
    private const val KEY_RESEND_AVAILABLE_AT = "cp_otp_resend_available_at"

    /** Client-side estimate of OTP validity (same as the register flow). */
    private const val OTP_TTL_MILLIS = 5 * 60 * 1000L

    /** Cooldown between resends for the inline change-password section. */
    const val RESEND_COOLDOWN_MILLIS = 45_000L

    data class State(
        val expiresAt: Long,
        val resendAvailableAt: Long
    )

    /** Marks "OTP sent" (presence of state) + arms expiry and resend timers. */
    fun save(context: Context) {
        val now = System.currentTimeMillis()
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong(KEY_EXPIRES_AT, now + OTP_TTL_MILLIS)
            .putLong(KEY_RESEND_AVAILABLE_AT, now + RESEND_COOLDOWN_MILLIS)
            .apply()
    }

    /** Re-arms only the resend cooldown after a successful resend. */
    fun markResendSent(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong(KEY_RESEND_AVAILABLE_AT, System.currentTimeMillis() + RESEND_COOLDOWN_MILLIS)
            .apply()
    }

    /** Raw read with no side effects — used for countdown math. */
    fun peek(context: Context): State? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L)
        if (expiresAt <= 0L) return null
        return State(
            expiresAt = expiresAt,
            resendAvailableAt = prefs.getLong(KEY_RESEND_AVAILABLE_AT, 0L)
        )
    }

    /** Expiry-aware read: null (and clears) once the OTP is no longer valid. */
    fun getValid(context: Context): State? {
        val state = peek(context) ?: return null
        if (System.currentTimeMillis() > state.expiresAt) {
            clear(context)
            return null
        }
        return state
    }

    /** Wipes the sent-OTP state (success, collapse, logout, account deletion). */
    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .remove(KEY_EXPIRES_AT)
            .remove(KEY_RESEND_AVAILABLE_AT)
            .apply()
    }
}
