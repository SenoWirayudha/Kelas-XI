package com.komputerkit.wavesoffoodadmin.repository

import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.toObject
import com.komputerkit.wavesoffoodadmin.FirebaseHelper
import com.komputerkit.wavesoffoodadmin.model.Order
import com.komputerkit.wavesoffoodadmin.model.OrderStatus
import kotlinx.coroutines.tasks.await

class OrderRepository {
    
    private val ordersCollection = FirebaseHelper.getOrdersCollection()
    
    // Get all orders with pagination
    suspend fun getAllOrders(limit: Long = 20): List<Order> {
        return try {
            Log.d("OrderRepository", "Getting all orders without status filter")
            val snapshot = ordersCollection
                .limit(limit)
                .get()
                .await()
            
            Log.d("OrderRepository", "Found ${snapshot.documents.size} total orders")
            
            snapshot.documents.mapNotNull { document ->
                try {
                    Log.d("OrderRepository", "Processing order document: ${document.id}")
                    Log.d("OrderRepository", "Document data: ${document.data}")
                    
                    // Manual mapping to avoid deserialization errors
                    val data = document.data ?: return@mapNotNull null
                    
                    val order = Order(
                        id = document.id,
                        userId = data["userId"] as? String ?: "",
                        recipientName = data["recipientName"] as? String ?: "",
                        phone = data["phone"] as? String ?: "",
                        deliveryAddress = data["deliveryAddress"] as? String ?: "",
                        fullAddress = data["fullAddress"] as? String ?: "",
                        notes = data["notes"] as? String ?: "",
                        items = (data["items"] as? List<Map<String, Any>>) ?: emptyList(),
                        subtotal = (data["subtotal"] as? Number)?.toDouble() ?: 0.0,
                        deliveryFee = (data["deliveryFee"] as? Number)?.toDouble() ?: 0.0,
                        total = (data["total"] as? Number)?.toDouble() ?: 0.0,
                        status = data["status"] as? String ?: "PENDING",
                        paymentMethod = data["paymentMethod"] as? String ?: "Cash on Delivery",
                        createdAt = data["createdAt"] as? Timestamp,
                        updatedAt = data["updatedAt"] as? Timestamp,
                        stability = (data["stability"] as? Number)?.toInt() ?: 0
                    )
                    
                    Log.d("OrderRepository", "Successfully mapped order: ${order.id}, status: ${order.status}")
                    order
                } catch (e: Exception) {
                    Log.e("OrderRepository", "Error mapping order ${document.id}: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e("OrderRepository", "Error getting all orders: ${e.message}")
            emptyList()
        }
    }
    
    // Get orders by status
    suspend fun getOrdersByStatus(status: String, limit: Long = 20): List<Order> {
        return try {
            Log.d("OrderRepository", "Getting orders with status: $status")
            val snapshot = ordersCollection
                .whereEqualTo("status", status)
                .limit(limit)
                .get()
                .await()
            
            Log.d("OrderRepository", "Found ${snapshot.documents.size} orders with status $status")
            
            val orders = snapshot.documents.mapNotNull { document ->
                try {
                    Log.d("OrderRepository", "Processing order document: ${document.id}")
                    Log.d("OrderRepository", "Document data: ${document.data}")
                    
                    // Manual mapping to avoid deserialization errors
                    val data = document.data ?: return@mapNotNull null
                    
                    val order = Order(
                        id = document.id,
                        userId = data["userId"] as? String ?: "",
                        recipientName = data["recipientName"] as? String ?: "",
                        phone = data["phone"] as? String ?: "",
                        deliveryAddress = data["deliveryAddress"] as? String ?: "",
                        fullAddress = data["fullAddress"] as? String ?: "",
                        notes = data["notes"] as? String ?: "",
                        items = (data["items"] as? List<Map<String, Any>>) ?: emptyList(),
                        subtotal = (data["subtotal"] as? Number)?.toDouble() ?: 0.0,
                        deliveryFee = (data["deliveryFee"] as? Number)?.toDouble() ?: 0.0,
                        total = (data["total"] as? Number)?.toDouble() ?: 0.0,
                        status = data["status"] as? String ?: "PENDING",
                        paymentMethod = data["paymentMethod"] as? String ?: "Cash on Delivery",
                        createdAt = data["createdAt"] as? Timestamp,
                        updatedAt = data["updatedAt"] as? Timestamp,
                        stability = (data["stability"] as? Number)?.toInt() ?: 0
                    )
                    
                    Log.d("OrderRepository", "Successfully mapped order: ${order.id}, status: ${order.status}")
                    order
                } catch (e: Exception) {
                    Log.e("OrderRepository", "Error mapping order ${document.id}: ${e.message}")
                    null
                }
            }
            
            Log.d("OrderRepository", "Successfully mapped ${orders.size} orders")
            orders
        } catch (e: Exception) {
            Log.e("OrderRepository", "Error getting orders: ${e.message}")
            emptyList()
        }
    }
    
    // Update order status
    suspend fun updateOrderStatus(orderId: String, newStatus: String): Boolean {
        return try {
            ordersCollection.document(orderId)
                .update("status", newStatus)
                .await()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    // Get order by ID
    suspend fun getOrderById(orderId: String): Order? {
        return try {
            val snapshot = ordersCollection.document(orderId).get().await()
            snapshot.toObject<Order>()
        } catch (e: Exception) {
            null
        }
    }
    
    // Get pending orders
    suspend fun getPendingOrders(): List<Order> {
        return getOrdersByStatus(OrderStatus.PENDING.value)
    }
    
    // Get preparing orders
    suspend fun getPreparingOrders(): List<Order> {
        return getOrdersByStatus(OrderStatus.PREPARING.value)
    }
    
    // Get ready orders
    suspend fun getReadyOrders(): List<Order> {
        return getOrdersByStatus(OrderStatus.READY.value)
    }
    
    // Get order count by user ID
    suspend fun getOrderCountByUserId(userId: String): Int {
        return try {
            Log.d("OrderRepository", "Getting order count for userId: $userId")
            val snapshot = ordersCollection
                .whereEqualTo("userId", userId)
                .get()
                .await()
            
            val count = snapshot.documents.size
            Log.d("OrderRepository", "Found $count orders for userId: $userId")
            count
        } catch (e: Exception) {
            Log.e("OrderRepository", "Error getting order count for userId $userId: ${e.message}")
            0
        }
    }
    
    // Get orders by user ID
    suspend fun getOrdersByUserId(userId: String): List<Order> {
        return try {
            Log.d("OrderRepository", "Getting orders for userId: $userId")
            val snapshot = ordersCollection
                .whereEqualTo("userId", userId)
                .get()
                .await()
            
            Log.d("OrderRepository", "Found ${snapshot.documents.size} orders for userId: $userId")
            
            snapshot.documents.mapNotNull { document ->
                try {
                    val data = document.data ?: return@mapNotNull null
                    
                    val order = Order(
                        id = document.id,
                        userId = data["userId"] as? String ?: "",
                        recipientName = data["recipientName"] as? String ?: "",
                        phone = data["phone"] as? String ?: "",
                        deliveryAddress = data["deliveryAddress"] as? String ?: "",
                        fullAddress = data["fullAddress"] as? String ?: "",
                        notes = data["notes"] as? String ?: "",
                        items = (data["items"] as? List<Map<String, Any>>) ?: emptyList(),
                        subtotal = (data["subtotal"] as? Number)?.toDouble() ?: 0.0,
                        deliveryFee = (data["deliveryFee"] as? Number)?.toDouble() ?: 0.0,
                        total = (data["total"] as? Number)?.toDouble() ?: 0.0,
                        status = data["status"] as? String ?: "PENDING",
                        paymentMethod = data["paymentMethod"] as? String ?: "Cash on Delivery",
                        createdAt = data["createdAt"] as? Timestamp,
                        updatedAt = data["updatedAt"] as? Timestamp,
                        stability = (data["stability"] as? Number)?.toInt() ?: 0
                    )
                    
                    order
                } catch (e: Exception) {
                    Log.e("OrderRepository", "Error mapping order ${document.id}: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e("OrderRepository", "Error getting orders for userId $userId: ${e.message}")
            emptyList()
        }
    }
    
    // Get order statistics for dashboard
    suspend fun getOrderStats(): Map<String, Int> {
        return try {
            Log.d("OrderRepository", "Getting order statistics")
            val snapshot = ordersCollection.get().await()
            
            val allOrders = snapshot.documents.size
            val pendingCount = snapshot.documents.count { doc ->
                val status = doc.data?.get("status") as? String
                status == OrderStatus.PENDING.value
            }
            val preparingCount = snapshot.documents.count { doc ->
                val status = doc.data?.get("status") as? String
                status == OrderStatus.PREPARING.value
            }
            val readyCount = snapshot.documents.count { doc ->
                val status = doc.data?.get("status") as? String
                status == OrderStatus.READY.value
            }
            val deliveredCount = snapshot.documents.count { doc ->
                val status = doc.data?.get("status") as? String
                status == OrderStatus.DELIVERED.value
            }
            
            val stats = mapOf(
                "total" to allOrders,
                "pending" to pendingCount,
                "preparing" to preparingCount,
                "ready" to readyCount,
                "delivered" to deliveredCount
            )
            
            Log.d("OrderRepository", "Order stats: $stats")
            stats
        } catch (e: Exception) {
            Log.e("OrderRepository", "Error getting order stats: ${e.message}")
            mapOf(
                "total" to 0,
                "pending" to 0,
                "preparing" to 0,
                "ready" to 0,
                "delivered" to 0
            )
        }
    }
}
