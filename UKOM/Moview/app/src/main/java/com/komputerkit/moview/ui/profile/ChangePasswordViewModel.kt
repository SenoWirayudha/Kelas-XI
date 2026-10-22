package com.komputerkit.moview.ui.profile

import androidx.lifecycle.ViewModel

/**
 * In-memory state for the inline "Ganti Password" section.
 *
 * Survives configuration changes (so typed input is not lost), and is
 * intentionally NOT written to saved state or disk: after a process death the
 * user must retype the password. The OTP code lives here only while the
 * section is open and is never persisted.
 */
class ChangePasswordViewModel : ViewModel() {
    var expanded: Boolean = false
    var newPassword: String = ""
    var confirmPassword: String = ""
    var otpCode: String = ""
}
