package com.komputerkit.blogapp.repository

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp
import com.komputerkit.blogapp.data.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Date

class AuthRepository {
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()

    fun getCurrentUser(): FirebaseUser? = auth.currentUser

    fun isUserLoggedIn(): Boolean = auth.currentUser != null

    suspend fun signIn(email: String, password: String): Result<FirebaseUser> {
        return try {
            val result = auth.signInWithEmailAndPassword(email, password).await()
            Result.success(result.user!!)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signUp(email: String, password: String, displayName: String): Result<FirebaseUser> {
        return try {
            Log.d("AuthRepository", "=== STARTING SIGN UP PROCESS ===")
            Log.d("AuthRepository", "Email: $email, DisplayName: $displayName")
            
            // Step 1: Create Firebase Auth user
            Log.d("AuthRepository", "Step 1: Creating Firebase Auth user...")
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            val user = result.user!!
            Log.d("AuthRepository", "✅ Firebase Auth user created: ${user.uid}")
            Log.d("AuthRepository", "User email: ${user.email}")
            Log.d("AuthRepository", "User isEmailVerified: ${user.isEmailVerified}")
            
            // Step 2: Wait for Auth to settle
            Log.d("AuthRepository", "Step 2: Waiting for Auth to settle...")
            kotlinx.coroutines.delay(2000)
            
            // Step 3: Create Firestore document with multiple strategies
            Log.d("AuthRepository", "Step 3: Creating Firestore document...")
            
            // Strategy 1: Simple map approach
            val userMap = mapOf(
                "id" to user.uid,
                "email" to email,
                "displayName" to displayName,
                "profileImageUrl" to "",
                "profileImageBase64" to "",
                "createdAt" to com.google.firebase.Timestamp.now()
            )
            Log.d("AuthRepository", "Document data: $userMap")
            
            val documentRef = firestore.collection("users").document(user.uid)
            var success = false
            
            // Try Strategy 1: Direct set with Map
            try {
                Log.d("AuthRepository", "Strategy 1: Direct set with Map...")
                documentRef.set(userMap).await()
                kotlinx.coroutines.delay(2000)
                
                val verifyDoc = documentRef.get().await()
                if (verifyDoc.exists()) {
                    Log.d("AuthRepository", "✅ Strategy 1 SUCCESS! Data: ${verifyDoc.data}")
                    success = true
                }
            } catch (e: Exception) {
                Log.e("AuthRepository", "Strategy 1 failed", e)
            }
            
            // Try Strategy 2: HashMap approach if Strategy 1 failed
            if (!success) {
                try {
                    Log.d("AuthRepository", "Strategy 2: HashMap approach...")
                    val hashMap = hashMapOf<String, Any>(
                        "id" to user.uid,
                        "email" to email,
                        "displayName" to displayName,
                        "profileImageUrl" to "",
                        "profileImageBase64" to "",
                        "createdAt" to Date()
                    )
                    
                    documentRef.set(hashMap).await()
                    kotlinx.coroutines.delay(2000)
                    
                    val verifyDoc = documentRef.get().await()
                    if (verifyDoc.exists()) {
                        Log.d("AuthRepository", "✅ Strategy 2 SUCCESS! Data: ${verifyDoc.data}")
                        success = true
                    }
                } catch (e: Exception) {
                    Log.e("AuthRepository", "Strategy 2 failed", e)
                }
            }
            
            // Try Strategy 3: Field-by-field approach if Strategy 2 failed
            if (!success) {
                try {
                    Log.d("AuthRepository", "Strategy 3: Field-by-field approach...")
                    val batch = firestore.batch()
                    batch.set(documentRef, mapOf(
                        "id" to user.uid,
                        "email" to email,
                        "displayName" to displayName
                    ))
                    batch.update(documentRef, mapOf(
                        "profileImageUrl" to "",
                        "profileImageBase64" to "",
                        "createdAt" to Date()
                    ))
                    batch.commit().await()
                    
                    kotlinx.coroutines.delay(2000)
                    val verifyDoc = documentRef.get().await()
                    if (verifyDoc.exists()) {
                        Log.d("AuthRepository", "✅ Strategy 3 SUCCESS! Data: ${verifyDoc.data}")
                        success = true
                    }
                } catch (e: Exception) {
                    Log.e("AuthRepository", "Strategy 3 failed", e)
                }
            }
            
            if (!success) {
                Log.e("AuthRepository", "❌ ALL STRATEGIES FAILED")
                // Don't fail the registration, just log the issue
                Log.w("AuthRepository", "User created in Auth but Firestore document failed. User can still login.")
            }
            
            Log.d("AuthRepository", "=== SIGN UP COMPLETED ===")
            Result.success(user)
            
        } catch (e: Exception) {
            Log.e("AuthRepository", "=== SIGN UP FAILED ===", e)
            Result.failure(e)
        }
    }

    fun signOut() {
        auth.signOut()
    }

    fun getAuthStateFlow(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            trySend(auth.currentUser)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun getUserData(userId: String): Result<User> {
        return try {
            Log.d("AuthRepository", "=== FETCHING USER DATA ===")
            Log.d("AuthRepository", "User ID: $userId")
            
            val document = firestore.collection("users").document(userId).get().await()
            Log.d("AuthRepository", "Document exists: ${document.exists()}")
            
            if (document.exists()) {
                Log.d("AuthRepository", "Raw document data: ${document.data}")
                
                val data = document.data!!
                val profileImageBase64 = data["profileImageBase64"] as? String ?: ""
                
                Log.d("AuthRepository", "Profile image base64 field value length: ${profileImageBase64.length}")
                if (profileImageBase64.isNotEmpty()) {
                    Log.d("AuthRepository", "Profile image preview: ${profileImageBase64.take(50)}...")
                }
                
                // Manual conversion to handle Timestamp properly
                val user = User(
                    id = data["id"] as? String ?: userId,
                    email = data["email"] as? String ?: "",
                    displayName = data["displayName"] as? String ?: "",
                    profileImageUrl = data["profileImageUrl"] as? String ?: "",
                    profileImageBase64 = profileImageBase64,
                    createdAt = when (val timestamp = data["createdAt"]) {
                        is com.google.firebase.Timestamp -> timestamp.toDate()
                        is Date -> timestamp
                        else -> Date()
                    }
                )
                
                Log.d("AuthRepository", "✅ User object created: ${user.displayName}")
                Log.d("AuthRepository", "Final user profile image length: ${user.profileImageBase64.length}")
                Result.success(user)
            } else {
                Log.e("AuthRepository", "❌ User document does not exist")
                Result.failure(Exception("User not found"))
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "❌ Error fetching user data", e)
            Result.failure(e)
        }
    }

    suspend fun createMissingUserDocument(userId: String, email: String, displayName: String): Result<Unit> {
        return try {
            Log.d("AuthRepository", "Creating missing user document for: $userId")
            val userMap = hashMapOf(
                "id" to userId,
                "email" to email,
                "displayName" to displayName,
                "profileImageUrl" to "",
                "profileImageBase64" to "",
                "createdAt" to Date()
            )
            
            firestore.collection("users").document(userId).set(userMap).await()
            Log.d("AuthRepository", "Missing user document created successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Failed to create missing user document", e)
            Result.failure(e)
        }
    }

    suspend fun updateProfilePhoto(userId: String, base64Image: String): Result<Unit> {
        return try {
            Log.d("AuthRepository", "Updating profile photo for user: $userId")
            firestore.collection("users")
                .document(userId)
                .update("profileImageBase64", base64Image)
                .await()
            Log.d("AuthRepository", "Profile photo updated successfully in Firestore")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Failed to update profile photo in Firestore", e)
            Result.failure(e)
        }
    }

    suspend fun updateUserProfile(userId: String, displayName: String, profileImageBase64: String = ""): Result<Unit> {
        return try {
            val updates = mutableMapOf<String, Any>(
                "displayName" to displayName
            )
            if (profileImageBase64.isNotEmpty()) {
                updates["profileImageBase64"] = profileImageBase64
            }
            
            firestore.collection("users")
                .document(userId)
                .update(updates)
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
