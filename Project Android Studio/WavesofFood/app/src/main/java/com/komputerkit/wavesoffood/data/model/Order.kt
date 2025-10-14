package com.komputerkit.wavesoffood.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class Order(
    val id: String = "",
    val userId: String = "",
    val items: List<OrderItem> = emptyList(),
    val totalAmount: Double = 0.0,
    val status: OrderStatus = OrderStatus.PENDING,
    val deliveryAddress: String = "",
    val createdAt: Long = System.currentTimeMillis()
) : Parcelable

@Parcelize
data class OrderItem(
    val foodId: String = "",
    val foodName: String = "",
    val quantity: Int = 0,
    val price: Double = 0.0
) : Parcelable

enum class OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    ON_THE_WAY,
    DELIVERED,
    CANCELLED
}
