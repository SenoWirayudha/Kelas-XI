package com.komputerkit.wavesoffoodadmin.model

import com.google.firebase.Timestamp

data class User(
    var id: String = "",
    var name: String = "",
    var email: String = "",
    var phone: String = "",
    var profileImage: String = "",
    var address: Map<String, Any> = mapOf(),
    var cart: List<Map<String, Any>> = listOf(),
    var orders: List<String> = listOf(),
    var createdAt: Timestamp? = null,
    var isBanned: Boolean = false,
    var bannedAt: Timestamp? = null,
    var banReason: String = ""
) {
    // Helper method to get full address
    fun getFullAddress(): String {
        return address["fullAddress"] as? String ?: ""
    }
    
    // Helper method to get phone from address if not in main phone field
    fun getPhoneNumber(): String {
        return if (phone.isNotEmpty()) {
            phone
        } else {
            address["phone"] as? String ?: ""
        }
    }
}
