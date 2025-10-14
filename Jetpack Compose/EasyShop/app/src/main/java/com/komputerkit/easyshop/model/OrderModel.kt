package com.komputerkit.easyshop.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.PropertyName

/**
 * Data class untuk merepresentasikan pesanan yang telah dibuat
 * 
 * @property id ID pesanan unik (format: ORD_XXXXXXXXXX)
 * @property date Timestamp ketika pesanan dibuat
 * @property userId ID pengguna yang membuat pesanan
 * @property items Map produk yang dipesan (productId -> quantity)
 * @property status Status pesanan (default: "Ordered")
 * @property address Alamat pengiriman
 * @property totalAmount Total pembayaran
 */
data class OrderModel(
    @PropertyName("id")
    val id: String = "",
    
    @PropertyName("date")
    val date: Timestamp = Timestamp.now(),
    
    @PropertyName("userId")
    val userId: String = "",
    
    @PropertyName("items")
    val items: Map<String, Long> = emptyMap(),
    
    @PropertyName("status")
    val status: String = "Ordered",
    
    @PropertyName("address")
    val address: String = "",
    
    @PropertyName("totalAmount")
    val totalAmount: Double = 0.0
) {
    /**
     * Konversi OrderModel ke Map untuk disimpan ke Firestore
     */
    fun toMap(): Map<String, Any> {
        return hashMapOf(
            "id" to id,
            "date" to date,
            "userId" to userId,
            "items" to items,
            "status" to status,
            "address" to address,
            "totalAmount" to totalAmount
        )
    }
    
    companion object {
        /**
         * Membuat OrderModel dari Map Firestore
         */
        fun fromMap(map: Map<String, Any>): OrderModel {
            return OrderModel(
                id = map["id"] as? String ?: "",
                date = map["date"] as? Timestamp ?: Timestamp.now(),
                userId = map["userId"] as? String ?: "",
                items = (map["items"] as? Map<String, Long>) ?: emptyMap(),
                status = map["status"] as? String ?: "Ordered",
                address = map["address"] as? String ?: "",
                totalAmount = (map["totalAmount"] as? Number)?.toDouble() ?: 0.0
            )
        }
        
        /**
         * Generate ID pesanan unik dengan format ORD_XXXXXXXXXX
         */
        fun generateOrderId(): String {
            val uuid = java.util.UUID.randomUUID().toString()
                .replace("-", "")
                .take(10)
                .uppercase()
            return "ORD_$uuid"
        }
    }
}
