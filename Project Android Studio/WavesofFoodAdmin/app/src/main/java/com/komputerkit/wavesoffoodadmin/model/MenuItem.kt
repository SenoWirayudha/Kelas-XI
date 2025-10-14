package com.komputerkit.wavesoffoodadmin.model

import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class MenuItem(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val price: Double = 0.0,
    val category: String = "",
    val imageUrl: String = "",
    @PropertyName("isAvailable")
    val isAvailable: Boolean = true,
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    @ServerTimestamp
    val createdAt: Date? = null
)
