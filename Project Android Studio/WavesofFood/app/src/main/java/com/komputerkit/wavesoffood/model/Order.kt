package com.komputerkit.wavesoffood.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import com.google.firebase.Timestamp

@Parcelize
data class Order(
    val id: String = "",
    val userId: String = "",
    val items: List<OrderItem> = emptyList(),
    val deliveryAddress: DeliveryAddress = DeliveryAddress(),
    val status: Status = Status.PENDING,
    val subtotal: Double = 0.0,
    val deliveryFee: Double = 0.0,
    val total: Double = 0.0,
    val paymentMethod: String = "",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null,
    val hasRatedAllItems: Boolean = false
) : Parcelable

@Parcelize
data class OrderItem(
    val id: String = "",  // Unique ID for this order item
    val foodId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val quantity: Int = 0,
    val totalPrice: Double = 0.0,
    val rating: Float = 0f,
    val review: String = "",
    val hasRated: Boolean = false
) : Parcelable

@Parcelize
data class DeliveryAddress(
    val fullAddress: String = "",
    val recipientName: String = "",
    val phone: String = "",
    val notes: String = ""
) : Parcelable
