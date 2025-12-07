package com.komputerkit.wavesoffoodadmin.model

import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Category(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val imageUrl: String = "",
    val isActive: Boolean = true,
    val sortOrder: Int = 0,
    @ServerTimestamp
    val createdAt: Date? = null,
    @ServerTimestamp
    val updatedAt: Date? = null
)
