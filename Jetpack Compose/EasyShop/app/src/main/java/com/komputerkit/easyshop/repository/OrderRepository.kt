package com.komputerkit.easyshop.repository

import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.easyshop.model.CartItem
import com.komputerkit.easyshop.model.OrderModel
import kotlinx.coroutines.tasks.await

/**
 * Repository untuk mengelola operasi order di Firestore
 */
object OrderRepository {
    
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    /**
     * Menyelesaikan order dan mengosongkan cart
     * 
     * Proses:
     * 1. Generate ID order unik (format: ORD_XXXXXXXXXX)
     * 2. Konversi CartItem ke Map<String, Long> untuk items
     * 3. Buat OrderModel baru
     * 4. Simpan order ke collection "orders"
     * 5. Hapus semua item dari cart user di Firestore
     * 
     * @param cartItems List CartItem yang akan diorder
     * @param address Alamat pengiriman
     * @param totalAmount Total pembayaran
     * @return Pair<Boolean, String> - (Success status, Order ID atau Error message)
     */
    suspend fun completeOrderAndClearCart(
        cartItems: List<CartItem>,
        address: String,
        totalAmount: Double
    ): Pair<Boolean, String> {
        return try {
            // 1. Dapatkan userId
            val userId = auth.currentUser?.uid
            if (userId == null) {
                return Pair(false, "User tidak login")
            }
            
            if (cartItems.isEmpty()) {
                return Pair(false, "Cart kosong")
            }
            
            // 2. Dapatkan referensi dokumen user
            val userDocRef = firestore.collection("users").document(userId)
            
            // 3. Generate ID order unik (format: ORD_XXXXXXXXXX)
            val orderId = OrderModel.generateOrderId()
            
            // 4. Konversi CartItem list menjadi Map<String, Long>
            val itemsMap = cartItems.associate { cartItem ->
                cartItem.product.id to cartItem.quantity.toLong()
            }
            
            // 5. Buat OrderModel baru
            val order = OrderModel(
                id = orderId,
                date = Timestamp.now(),
                userId = userId,
                items = itemsMap,
                status = "Ordered",
                address = address,
                totalAmount = totalAmount
            )
            
            // 6. Simpan order ke Firestore collection "orders"
            firestore.collection("orders")
                .document(orderId)
                .set(order.toMap())
                .await()
            
            println("OrderRepository: Order saved successfully with ID: $orderId")
            
            // 7. Clear cart - hapus semua item dari subcollection cart
            println("OrderRepository: Starting to clear cart...")
            val cartSnapshot = firestore.collection("users")
                .document(userId)
                .collection("cart")
                .get()
                .await()
            
            println("OrderRepository: Found ${cartSnapshot.documents.size} items in cart to delete")
            
            // Hapus setiap dokumen di cart
            for (doc in cartSnapshot.documents) {
                println("OrderRepository: Deleting cart item with ID: ${doc.id}")
                doc.reference.delete().await()
            }
            
            println("OrderRepository: Cart cleared successfully - ${cartSnapshot.documents.size} items deleted")
            
            // Return success dengan order ID
            Pair(true, orderId)
            
        } catch (e: Exception) {
            println("OrderRepository ERROR: ${e.message}")
            e.printStackTrace()
            Pair(false, "Gagal memproses pesanan: ${e.message}")
        }
    }
    
    /**
     * Mendapatkan daftar order milik user
     * 
     * @return List<OrderModel> atau null jika gagal
     */
    suspend fun getUserOrders(): List<OrderModel>? {
        return try {
            val userId = auth.currentUser?.uid
            println("OrderRepository: Getting orders for userId: $userId")
            
            if (userId == null) {
                println("OrderRepository ERROR: User not authenticated")
                return null
            }
            
            println("OrderRepository: Querying Firestore...")
            val snapshot = firestore.collection("orders")
                .whereEqualTo("userId", userId)
                .get()
                .await()
            
            println("OrderRepository: Found ${snapshot.documents.size} documents")
            
            val orders = snapshot.documents.mapNotNull { doc ->
                println("OrderRepository: Processing document ${doc.id}")
                try {
                    val data = doc.data
                    println("OrderRepository: Document data: $data")
                    data?.let { OrderModel.fromMap(it) }
                } catch (e: Exception) {
                    println("OrderRepository ERROR parsing document ${doc.id}: ${e.message}")
                    e.printStackTrace()
                    null
                }
            }
            
            println("OrderRepository: Successfully parsed ${orders.size} orders")
            
            // Sort by date descending in client-side
            val sortedOrders = orders.sortedByDescending { it.date.toDate().time }
            println("OrderRepository: Sorted ${sortedOrders.size} orders")
            
            sortedOrders
            
        } catch (e: Exception) {
            println("OrderRepository ERROR getting orders: ${e.message}")
            e.printStackTrace()
            null
        }
    }
    
    /**
     * Mendapatkan detail order berdasarkan ID
     * 
     * @param orderId ID order yang akan diambil
     * @return OrderModel atau null jika tidak ditemukan
     */
    suspend fun getOrderById(orderId: String): OrderModel? {
        return try {
            val doc = firestore.collection("orders")
                .document(orderId)
                .get()
                .await()
            
            doc.data?.let { OrderModel.fromMap(it) }
            
        } catch (e: Exception) {
            println("OrderRepository ERROR getting order: ${e.message}")
            null
        }
    }
}
