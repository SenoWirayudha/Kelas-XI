package com.komputerkit.wavesoffood.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.komputerkit.wavesoffood.model.Food
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.model.Status
import com.komputerkit.wavesoffood.model.User
import kotlinx.coroutines.tasks.await
import java.util.Date

object FirebaseManager {
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()
    private val storage = FirebaseStorage.getInstance()

    // Authentication Methods
    suspend fun login(email: String, password: String): User {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        val userId = result.user?.uid ?: throw Exception("Login failed")
        
        return try {
            val userDoc = db.collection("users").document(userId).get().await()
            userDoc.toObject(User::class.java)?.copy(id = userDoc.id) 
                ?: throw Exception("User profile not found")
        } catch (e: Exception) {
            throw Exception("Failed to retrieve user profile: ${e.message}")
        }
    }

    suspend fun register(email: String, password: String, name: String, phone: String = ""): User {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val userId = result.user?.uid ?: throw Exception("Registration failed")
        
        val newUser = User(
            id = userId,
            name = name,
            email = email,
            phone = phone,
            address = null,
            profileImage = ""
        )
        
        db.collection("users").document(userId).set(newUser).await()
        return newUser
    }

    suspend fun logout() {
        auth.signOut()
    }

    suspend fun resetPassword(email: String) {
        auth.sendPasswordResetEmail(email).await()
    }

    fun isUserLoggedIn(): Boolean {
        return auth.currentUser != null
    }

    // User Management
    suspend fun getCurrentUser(): User? {
        val userId = auth.currentUser?.uid ?: return null
        return try {
            db.collection("users")
                .document(userId)
                .get()
                .await()
                .toObject(User::class.java)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun updateUserProfile(user: User) {
        val userId = auth.currentUser?.uid ?: throw IllegalStateException("No user logged in")
        db.collection("users")
            .document(userId)
            .set(user)
            .await()
    }

    // Food Management
    suspend fun getAllFoods(): List<Food> {
        return try {
            db.collection("foods")
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(Food::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getFoodsByCategory(category: String): List<Food> {
        return try {
            db.collection("foods")
                .whereEqualTo("category", category)
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(Food::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getPopularFoods(limit: Int = 5): List<Food> {
        return try {
            db.collection("foods")
                .orderBy("rating", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(limit.toLong())
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(Food::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Cart Management
    suspend fun getCartItems(userId: String): List<com.komputerkit.wavesoffood.model.CartItem> {
        return try {
            db.collection("users")
                .document(userId)
                .collection("cart")
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(com.komputerkit.wavesoffood.model.CartItem::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun addToCart(userId: String, foodId: String, quantity: Int) {
        val foodDoc = db.collection("foods").document(foodId).get().await()
        val food = foodDoc.toObject(Food::class.java) ?: throw IllegalStateException("Food not found")

        val cartItem = hashMapOf(
            "foodId" to foodId,
            "name" to food.name,
            "price" to food.price,
            "quantity" to quantity,
            "imageUrl" to food.imageUrl,
            "totalPrice" to (food.price * quantity)
        )

        db.collection("users")
            .document(userId)
            .collection("cart")
            .add(cartItem)
            .await()
    }

    suspend fun updateCartItemQuantity(userId: String, cartItemId: String, quantity: Int) {
        val cartItem = db.collection("users")
            .document(userId)
            .collection("cart")
            .document(cartItemId)
            .get()
            .await()

        val price = cartItem.getDouble("price") ?: 0.0
        val totalPrice = price * quantity

        db.collection("users")
            .document(userId)
            .collection("cart")
            .document(cartItemId)
            .update(
                mapOf(
                    "quantity" to quantity,
                    "totalPrice" to totalPrice
                )
            )
            .await()
    }

    suspend fun removeFromCart(userId: String, cartItemId: String) {
        db.collection("users")
            .document(userId)
            .collection("cart")
            .document(cartItemId)
            .delete()
            .await()
    }

    suspend fun clearCart(userId: String) {
        val cartCollection = db.collection("users")
            .document(userId)
            .collection("cart")
        
        val cartItems = cartCollection.get().await()
        for (doc in cartItems.documents) {
            doc.reference.delete().await()
        }
    }

    // Order Management
    suspend fun createOrder(order: Order): String {
        val orderDoc = db.collection("orders").document()
        val orderMap = hashMapOf(
            "userId" to order.userId,
            "items" to order.items,
            "deliveryAddress" to order.deliveryAddress,
            "status" to order.status.name,
            "subtotal" to order.subtotal,
            "deliveryFee" to order.deliveryFee,
            "total" to order.total,
            "createdAt" to Date(),
            "updatedAt" to Date()
        )

        orderDoc.set(orderMap).await()
        return orderDoc.id
    }

    suspend fun updateOrderStatus(orderId: String, status: Status) {
        db.collection("orders")
            .document(orderId)
            .update(
                mapOf(
                    "status" to status.name,
                    "updatedAt" to Date()
                )
            )
            .await()
    }

    suspend fun getUserOrders(userId: String): List<Order> {
        return try {
            db.collection("orders")
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(Order::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Address Management
    suspend fun getUserAddresses(userId: String): List<com.komputerkit.wavesoffood.model.Address> {
        return try {
            db.collection("users")
                .document(userId)
                .collection("addresses")
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(com.komputerkit.wavesoffood.model.Address::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun addAddress(userId: String, address: com.komputerkit.wavesoffood.model.Address) {
        db.collection("users")
            .document(userId)
            .collection("addresses")
            .add(address)
            .await()
    }

    suspend fun updateAddress(userId: String, addressId: String, address: com.komputerkit.wavesoffood.model.Address) {
        db.collection("users")
            .document(userId)
            .collection("addresses")
            .document(addressId)
            .set(address)
            .await()
    }

    suspend fun deleteAddress(userId: String, addressId: String) {
        db.collection("users")
            .document(userId)
            .collection("addresses")
            .document(addressId)
            .delete()
            .await()
    }

    // Admin Functions
    suspend fun addFood(food: Food, imageByteArray: ByteArray): String {
        // Upload image first
        val imageRef = storage.reference.child("foods/${System.currentTimeMillis()}.jpg")
        imageRef.putBytes(imageByteArray).await()
        val imageUrl = imageRef.downloadUrl.await().toString()

        // Create food document
        val foodDoc = db.collection("foods").document()
        val foodWithImage = food.copy(
            id = foodDoc.id,
            imageUrl = imageUrl,
            createdAt = Date(),
            updatedAt = Date()
        )

        foodDoc.set(foodWithImage).await()
        return foodDoc.id
    }

    suspend fun updateFood(foodId: String, food: Food, imageByteArray: ByteArray?) {
        var imageUrl = food.imageUrl

        // Upload new image if provided
        if (imageByteArray != null) {
            val imageRef = storage.reference.child("foods/${System.currentTimeMillis()}.jpg")
            imageRef.putBytes(imageByteArray).await()
            imageUrl = imageRef.downloadUrl.await().toString()
        }

        val updatedFood = food.copy(
            imageUrl = imageUrl,
            updatedAt = Date()
        )

        db.collection("foods")
            .document(foodId)
            .set(updatedFood)
            .await()
    }

    suspend fun deleteFood(foodId: String) {
        // Get food document to get image URL
        val foodDoc = db.collection("foods").document(foodId).get().await()
        val imageUrl = foodDoc.getString("imageUrl")

        // Delete image from storage if exists
        if (!imageUrl.isNullOrEmpty()) {
            try {
                storage.getReferenceFromUrl(imageUrl).delete().await()
            } catch (e: Exception) {
                // Image might already be deleted or not exist
            }
        }

        // Delete food document
        db.collection("foods")
            .document(foodId)
            .delete()
            .await()
    }

    suspend fun getAllPendingOrders(): List<Order> {
        return try {
            db.collection("orders")
                .whereEqualTo("status", Status.PENDING.name)
                .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.ASCENDING)
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    doc.toObject(Order::class.java)?.copy(id = doc.id)
                }
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Additional methods without userId for repositories
    suspend fun getCartItems(): List<com.komputerkit.wavesoffood.model.CartItem> {
        val currentUser = auth.currentUser ?: return emptyList()
        return getCartItems(currentUser.uid)
    }

    suspend fun addToCart(foodId: String, quantity: Int) {
        val currentUser = auth.currentUser ?: return
        addToCart(currentUser.uid, foodId, quantity)
    }

    suspend fun updateCartItemQuantity(cartItemId: String, quantity: Int) {
        val currentUser = auth.currentUser ?: return
        updateCartItemQuantity(currentUser.uid, cartItemId, quantity)
    }

    suspend fun removeFromCart(cartItemId: String) {
        val currentUser = auth.currentUser ?: return
        removeFromCart(currentUser.uid, cartItemId)
    }

    suspend fun clearCart() {
        val currentUser = auth.currentUser ?: return
        clearCart(currentUser.uid)
    }

    suspend fun getFoodById(foodId: String): Food? {
        return try {
            val doc = db.collection("foods").document(foodId).get().await()
            doc.toObject(Food::class.java)?.copy(id = doc.id)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun searchFoods(query: String): List<Food> {
        return try {
            val foods = getAllFoods()
            foods.filter { 
                it.name.contains(query, ignoreCase = true) || 
                it.description.contains(query, ignoreCase = true) ||
                it.category.contains(query, ignoreCase = true)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getUserAddresses(): List<com.komputerkit.wavesoffood.model.Address> {
        val currentUser = auth.currentUser ?: return emptyList()
        return getUserAddresses(currentUser.uid)
    }

    suspend fun addAddress(address: com.komputerkit.wavesoffood.model.Address) {
        val currentUser = auth.currentUser ?: return
        addAddress(currentUser.uid, address)
    }

    suspend fun updateAddress(addressId: String, address: com.komputerkit.wavesoffood.model.Address) {
        val currentUser = auth.currentUser ?: return
        updateAddress(currentUser.uid, addressId, address)
    }

    suspend fun deleteAddress(addressId: String) {
        val currentUser = auth.currentUser ?: return
        deleteAddress(currentUser.uid, addressId)
    }

    suspend fun getAllOrders(): List<Order> {
        val currentUser = auth.currentUser ?: return emptyList()
        return getUserOrders(currentUser.uid)
    }

    suspend fun getOrderById(orderId: String): Order? {
        return try {
            val doc = db.collection("orders").document(orderId).get().await()
            doc.toObject(Order::class.java)?.copy(id = doc.id)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun placeOrder(userId: String, order: Order): String {
        val orderDoc = db.collection("orders").document()
        val orderWithId = order.copy(
            id = orderDoc.id,
            userId = userId,
            createdAt = com.google.firebase.Timestamp.now(),
            updatedAt = com.google.firebase.Timestamp.now()
        )
        orderDoc.set(orderWithId).await()
        return orderDoc.id
    }

    suspend fun placeOrder(order: Order): String {
        val currentUser = auth.currentUser ?: throw Exception("User not authenticated")
        return placeOrder(currentUser.uid, order)
    }
}
