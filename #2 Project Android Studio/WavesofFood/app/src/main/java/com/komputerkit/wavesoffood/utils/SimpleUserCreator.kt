package com.komputerkit.wavesoffood.utils

import android.content.Context
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.model.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

object SimpleUserCreator {
    
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()
    
    data class TestUser(
        val name: String,
        val email: String,
        val phone: String,
        val password: String
    )
    
    private val testUsers = listOf(
        TestUser("John Doe", "john@test.com", "+628123456789", "123456"),
        TestUser("Jane Smith", "jane@test.com", "+628234567890", "123456"),
        TestUser("Mike Johnson", "mike@test.com", "+628345678901", "123456"),
        TestUser("Sarah Wilson", "sarah@test.com", "+628456789012", "123456"),
        TestUser("David Brown", "david@test.com", "+628567890123", "123456")
    )
    
    fun createTestUsers(context: Context, callback: (String) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            var successCount = 0
            var errorCount = 0
            
            try {
                for (testUser in testUsers) {
                    try {
                        // Create user in Firebase Auth
                        val result = auth.createUserWithEmailAndPassword(testUser.email, testUser.password).await()
                        val userId = result.user?.uid ?: continue
                        
                        // Create user document in Firestore
                        val user = User(
                            id = userId,
                            name = testUser.name,
                            email = testUser.email,
                            phone = testUser.phone,
                            address = null,
                            profileImage = ""
                        )
                        
                        db.collection("users").document(userId).set(user).await()
                        successCount++
                        
                    } catch (e: Exception) {
                        errorCount++
                        // Silently continue with next user
                    }
                }
                
                withContext(Dispatchers.Main) {
                    val message = "Created $successCount users successfully" + 
                                if (errorCount > 0) " ($errorCount failed)" else ""
                    callback(message)
                }
                
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    callback("Failed to create test users: ${e.message}")
                }
            }
        }
    }
    
    fun getTestUserCredentials(): String {
        return testUsers.joinToString("\n") { 
            "${it.name}: ${it.email} / ${it.password}"
        }
    }
}
