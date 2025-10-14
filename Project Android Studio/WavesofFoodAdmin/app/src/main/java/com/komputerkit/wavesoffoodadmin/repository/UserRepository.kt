package com.komputerkit.wavesoffoodadmin.repository

import android.util.Log
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.ktx.toObject
import com.komputerkit.wavesoffoodadmin.FirebaseHelper
import com.komputerkit.wavesoffoodadmin.model.Order
import com.komputerkit.wavesoffoodadmin.model.User
import kotlinx.coroutines.tasks.await

class UserRepository {
    
    private val usersCollection = FirebaseHelper.getUsersCollection()
    private val ordersCollection = FirebaseHelper.getOrdersCollection()
    
    // Get all users
    suspend fun getAllUsers(): List<User> {
        return try {
            Log.d("UserRepository", "Getting all users...")
            val snapshot = usersCollection
                .get()
                .await()
            
            Log.d("UserRepository", "Found ${snapshot.documents.size} user documents")
            
            val users = snapshot.documents.mapNotNull { document ->
                try {
                    Log.d("UserRepository", "Processing document: ${document.id}")
                    
                    // Manual mapping to ensure all fields are correctly mapped
                    val user = User(
                        id = document.id,
                        name = document.getString("name") ?: "",
                        email = document.getString("email") ?: "",
                        phone = document.getString("phone") ?: "",
                        profileImage = document.getString("profileImage") ?: "",
                        address = document.get("address") as? Map<String, Any> ?: mapOf(),
                        cart = document.get("cart") as? List<Map<String, Any>> ?: listOf(),
                        orders = document.get("orders") as? List<String> ?: listOf(),
                        createdAt = document.getTimestamp("createdAt"),
                        isBanned = document.getBoolean("isBanned") ?: false,
                        bannedAt = document.getTimestamp("bannedAt"),
                        banReason = document.getString("banReason") ?: ""
                    )
                    
                    Log.d("UserRepository", "Mapped user: ${user.name}, email: ${user.email}, isBanned: ${user.isBanned}")
                    user
                } catch (e: Exception) {
                    Log.e("UserRepository", "Error mapping document ${document.id}: ${e.message}")
                    null
                }
            }
            
            Log.d("UserRepository", "Successfully mapped ${users.size} users")
            users
        } catch (e: Exception) {
            Log.e("UserRepository", "Error getting users: ${e.message}")
            emptyList()
        }
    }
    
    // Get user by ID
    suspend fun getUserById(userId: String): User? {
        return try {
            val snapshot = usersCollection.document(userId).get().await()
            snapshot.toObject<User>()
        } catch (e: Exception) {
            null
        }
    }
    
    // Get user orders
    suspend fun getUserOrders(userId: String): List<Order> {
        return try {
            val snapshot = ordersCollection
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { it.toObject<Order>() }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // Search users
    suspend fun searchUsers(query: String): List<User> {
        return try {
            val allUsers = getAllUsers()
            allUsers.filter { user ->
                user.name.contains(query, ignoreCase = true) ||
                user.email.contains(query, ignoreCase = true) ||
                user.phone.contains(query, ignoreCase = true)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // Get user statistics
    suspend fun getUserStats(): Map<String, Int> {
        return try {
            val users = getAllUsers()
            val stats = mutableMapOf<String, Int>()
            
            stats["total_users"] = users.size
            stats["users_with_orders"] = users.count { it.orders.isNotEmpty() }
            stats["users_with_phone"] = users.count { it.getPhoneNumber().isNotEmpty() }
            stats["banned_users"] = users.count { it.isBanned }
            
            stats
        } catch (e: Exception) {
            emptyMap()
        }
    }
    
    // Ban user
    suspend fun banUser(userId: String, reason: String): Boolean {
        return try {
            val updates = mapOf(
                "isBanned" to true,
                "bannedAt" to com.google.firebase.Timestamp.now(),
                "banReason" to reason
            )
            
            usersCollection.document(userId).update(updates).await()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    // Unban user
    suspend fun unbanUser(userId: String): Boolean {
        return try {
            val updates = mapOf(
                "isBanned" to false,
                "bannedAt" to null,
                "banReason" to ""
            )
            
            usersCollection.document(userId).update(updates).await()
            true
        } catch (e: Exception) {
            false
        }
    }
}
