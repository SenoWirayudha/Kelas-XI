package com.komputerkit.moview.ui.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

/**
 * Holds the partially-typed OTP so the 6 boxes survive configuration changes
 * (rotation, dark-mode switch, font-size change) without the user retyping.
 * The Fragment additionally mirrors the value into savedInstanceState so the
 * input also survives process death (where the ViewModel is cleared).
 */
class VerifyOtpViewModel : ViewModel() {

    private val _otpText = MutableLiveData<String?>(null)
    val otpText: LiveData<String?> = _otpText

    fun updateOtp(text: String) {
        _otpText.value = text
    }
}
