package com.komputerkit.wavesoffood.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val address: Address? = null,
    val profileImage: String = "",
    val isBanned: Boolean = false,
    val banReason: String = ""
) : Parcelable
