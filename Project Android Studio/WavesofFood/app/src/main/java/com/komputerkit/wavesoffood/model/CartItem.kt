package com.komputerkit.wavesoffood.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class CartItem(
    val id: String = "",
    val foodId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val quantity: Int = 0,
    val imageUrl: String = "",
    val totalPrice: Double = 0.0
) : Parcelable
