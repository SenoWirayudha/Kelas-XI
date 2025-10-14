package com.komputerkit.wavesoffoodadmin

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference

class FirebaseHelper {
    companion object {
        // Firebase Authentication
        fun getAuth(): FirebaseAuth = FirebaseAuth.getInstance()
        
        // Firebase Firestore
        fun getFirestore(): FirebaseFirestore = FirebaseFirestore.getInstance()
        
        // Firebase Storage
        fun getStorage(): StorageReference = FirebaseStorage.getInstance().reference
        
        // Firestore Collections (sesuai dengan struktur yang ada)
        fun getFoodsCollection(): CollectionReference = getFirestore().collection("foods")
        fun getOrdersCollection(): CollectionReference = getFirestore().collection("orders")
        fun getUsersCollection(): CollectionReference = getFirestore().collection("users")
        fun getAdminsCollection(): CollectionReference = getFirestore().collection("admins")
        
        // Storage References
        fun getFoodImagesRef(): StorageReference = getStorage().child("food_images")
        fun getProfileImagesRef(): StorageReference = getStorage().child("profile_images")
        
        // Current user
        fun getCurrentUser() = getAuth().currentUser
        
        // Check if user is logged in
        fun isUserLoggedIn(): Boolean = getCurrentUser() != null
        
        // Check if current user is admin
        fun isCurrentUserAdmin(callback: (Boolean) -> Unit) {
            val currentUser = getCurrentUser()
            if (currentUser == null) {
                callback(false)
                return
            }
            
            // Check admin by email instead of UID
            getAdminsCollection()
                .whereEqualTo("email", currentUser.email)
                .whereEqualTo("isActive", true)
                .get()
                .addOnSuccessListener { querySnapshot ->
                    val isAdmin = !querySnapshot.isEmpty
                    callback(isAdmin)
                }
                .addOnFailureListener {
                    callback(false)
                }
        }
        
        // Order status constants
        object OrderStatus {
            const val PENDING = "PENDING"
            const val CONFIRMED = "CONFIRMED"
            const val PREPARING = "PREPARING"
            const val READY = "READY"
            const val DELIVERED = "DELIVERED"
            const val CANCELLED = "CANCELLED"
        }
    }
}
