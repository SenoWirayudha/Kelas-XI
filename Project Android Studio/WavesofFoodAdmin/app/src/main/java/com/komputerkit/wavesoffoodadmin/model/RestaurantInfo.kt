package com.komputerkit.wavesoffoodadmin.model

import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class RestaurantInfo(
    val name: String = "",
    val description: String = "",
    val address: String = "",
    val phoneNumber: String = "",
    val email: String = "",
    val website: String = "",
    val logoUrl: String = "",
    val bannerUrl: String = "",
    val operatingHours: Map<String, OperatingHour> = mapOf(
        "monday" to OperatingHour(),
        "tuesday" to OperatingHour(),
        "wednesday" to OperatingHour(),
        "thursday" to OperatingHour(),
        "friday" to OperatingHour(),
        "saturday" to OperatingHour(),
        "sunday" to OperatingHour()
    ),
    val deliverySettings: DeliverySettings = DeliverySettings(),
    val socialMedia: SocialMedia = SocialMedia(),
    val settings: RestaurantSettings = RestaurantSettings(),
    @ServerTimestamp
    val updatedAt: Date? = null
)

data class OperatingHour(
    val open: String = "09:00",
    val close: String = "22:00",
    val isClosed: Boolean = false
)

data class DeliverySettings(
    val minimumOrder: Double = 0.0,
    val deliveryFee: Double = 0.0,
    val freeDeliveryThreshold: Double = 0.0,
    val deliveryRadius: Double = 5.0, // in km
    val estimatedDeliveryTime: Int = 30 // in minutes
)

data class SocialMedia(
    val facebook: String = "",
    val instagram: String = "",
    val twitter: String = ""
)

data class RestaurantSettings(
    val isAcceptingOrders: Boolean = true,
    val maintenanceMode: Boolean = false,
    val currency: String = "IDR",
    val taxRate: Double = 0.1 // 10%
)
