package com.komputerkit.wavesoffood.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class Address(
    val id: String = "",
    val label: String = "",  // e.g., "Home", "Office"
    val fullAddress: String = "",
    val recipientName: String = "",
    val phone: String = "",
    val notes: String = "",
    val isDefault: Boolean = false
) : Parcelable
