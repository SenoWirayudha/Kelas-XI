package com.komputerkit.wavesoffoodadmin.model

import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Admin(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "admin", // super_admin, admin, manager
    val isActive: Boolean = true,
    @ServerTimestamp
    val createdAt: Date? = null,
    val createdBy: String = ""
)

// Helper function untuk membuat admin baru
fun createAdmin(uid: String, name: String, email: String, role: String = "admin"): Admin {
    return Admin(
        uid = uid,
        name = name,
        email = email,
        role = role,
        isActive = true,
        createdBy = "system"
    )
}
