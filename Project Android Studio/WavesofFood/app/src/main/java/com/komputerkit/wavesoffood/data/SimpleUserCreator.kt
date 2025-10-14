package com.komputerkit.wavesoffood.data

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.model.User

object SimpleUserCreator {
    
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
    
    fun createTestUsers(
        onProgress: (String) -> Unit = {},
        onComplete: (String) -> Unit = {}
    ) {
        val auth = FirebaseAuth.getInstance()
        val db = FirebaseFirestore.getInstance()
        var successCount = 0
        var errorCount = 0
        val totalUsers = testUsers.size
        
        onProgress("Starting to create $totalUsers test users...")
        
        testUsers.forEachIndexed { index, testUser ->
            auth.createUserWithEmailAndPassword(testUser.email, testUser.password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val userId = auth.currentUser?.uid
                        if (userId != null) {
                            val user = User(
                                id = userId,
                                name = testUser.name,
                                email = testUser.email,
                                phone = testUser.phone,
                                address = null,
                                profileImage = ""
                            )
                            
                            db.collection("users")
                                .document(userId)
                                .set(user)
                                .addOnSuccessListener {
                                    successCount++
                                    Log.d("SimpleUserCreator", "✓ Created: ${testUser.name}")
                                    onProgress("✓ Created: ${testUser.name} ($successCount/$totalUsers)")
                                    
                                    if (successCount + errorCount == totalUsers) {
                                        val result = "Test users creation completed!\n" +
                                                "✓ Success: $successCount users\n" +
                                                "✗ Errors: $errorCount users"
                                        onComplete(result)
                                    }
                                }
                                .addOnFailureListener { e ->
                                    errorCount++
                                    Log.e("SimpleUserCreator", "✗ Failed to save ${testUser.name}: ${e.message}")
                                    onProgress("✗ Failed to save: ${testUser.name}")
                                    
                                    if (successCount + errorCount == totalUsers) {
                                        val result = "Test users creation completed!\n" +
                                                "✓ Success: $successCount users\n" +
                                                "✗ Errors: $errorCount users"
                                        onComplete(result)
                                    }
                                }
                        }
                    } else {
                        errorCount++
                        Log.e("SimpleUserCreator", "✗ Failed to create ${testUser.name}: ${task.exception?.message}")
                        onProgress("✗ Failed to create: ${testUser.name}")
                        
                        if (successCount + errorCount == totalUsers) {
                            val result = "Test users creation completed!\n" +
                                    "✓ Success: $successCount users\n" +
                                    "✗ Errors: $errorCount users"
                            onComplete(result)
                        }
                    }
                }
        }
    }
    
    fun getTestUserCredentials(): List<String> {
        return testUsers.map { 
            "${it.name} - Email: ${it.email} - Password: ${it.password}" 
        }
    }
}
