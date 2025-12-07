package com.komputerkit.wavesoffoodadmin.model

import com.google.firebase.Timestamp

data class Order(
    var id: String = "",
    val userId: String = "",
    val recipientName: String = "",
    val phone: String = "",
    val deliveryAddress: String = "",
    val fullAddress: String = "",
    val notes: String = "",
    val items: List<Map<String, Any>> = emptyList(),
    val subtotal: Double = 0.0,
    val deliveryFee: Double = 0.0,
    val total: Double = 0.0,
    val status: String = "PENDING",
    val paymentMethod: String = "Cash on Delivery",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null,
    val stability: Int = 0
) {
    // No-argument constructor required by Firestore
    constructor() : this(
        id = "",
        userId = "",
        recipientName = "",
        phone = "",
        deliveryAddress = "",
        fullAddress = "",
        notes = "",
        items = emptyList(),
        subtotal = 0.0,
        deliveryFee = 0.0,
        total = 0.0,
        status = "PENDING",
        paymentMethod = "Cash on Delivery",
        createdAt = null,
        updatedAt = null,
        stability = 0
    )
    
    // Helper method to convert items to OrderItem list
    fun getOrderItems(): List<OrderItem> {
        return items.mapNotNull { itemMap ->
            try {
                OrderItem(
                    foodId = itemMap["foodId"] as? String ?: "",
                    name = itemMap["name"] as? String ?: "",
                    price = (itemMap["price"] as? Number)?.toDouble() ?: 0.0,
                    quantity = (itemMap["quantity"] as? Number)?.toInt() ?: 1
                )
            } catch (e: Exception) {
                null
            }
        }
    }
}

data class OrderItem(
    val foodId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val quantity: Int = 1
)
