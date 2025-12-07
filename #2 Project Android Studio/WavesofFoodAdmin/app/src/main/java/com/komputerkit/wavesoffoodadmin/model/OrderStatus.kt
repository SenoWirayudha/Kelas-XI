package com.komputerkit.wavesoffoodadmin.model

enum class OrderStatus(val value: String, val displayName: String) {
    PENDING("PENDING", "Menunggu"),
    PREPARING("PREPARING", "Sedang Diproses"),
    READY("READY", "Siap"),
    DELIVERED("DELIVERED", "Terkirim"),
    CANCELLED("CANCELLED", "Dibatalkan");
    
    companion object {
        fun fromString(value: String): OrderStatus {
            return values().find { it.value == value } ?: PENDING
        }
        
        fun getDisplayName(status: String): String {
            return fromString(status).displayName
        }
        
        fun getAllStatuses(): List<OrderStatus> {
            return values().toList()
        }
        
        fun getActiveStatuses(): List<OrderStatus> {
            return listOf(PENDING, PREPARING, READY)
        }
    }
}
