package com.komputerkit.moview.ui.auth

/**
 * What a pending OTP verification is FOR.
 *
 * The same screen serves registration and the delete-account re-verification.
 * The purpose travels with the navigation arguments and with the persisted
 * pending state, so a resumed screen can never run the wrong action and an
 * app start can never resume a delete-account verification as a registration.
 */
enum class OtpPurpose(val wire: String) {
    REGISTER("register"),
    DELETE_ACCOUNT("delete_account");

    companion object {
        /** Unknown / legacy values resolve to null so callers can bail out safely. */
        fun fromWire(value: String?): OtpPurpose? =
            values().firstOrNull { it.wire == value }
    }
}
