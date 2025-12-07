package com.komputerkit.wavesoffood.data

import android.util.Log
import com.komputerkit.wavesoffood.model.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object DummyUserGenerator {
    
    data class DummyUser(
        val name: String,
        val email: String,
        val phone: String,
        val password: String
    )
    
    private val dummyUsers = listOf(
        DummyUser("John Doe", "john.doe@example.com", "+628123456789", "password123"),
        DummyUser("Jane Smith", "jane.smith@example.com", "+628234567890", "password123"),
        DummyUser("Mike Johnson", "mike.johnson@example.com", "+628345678901", "password123"),
        DummyUser("Sarah Wilson", "sarah.wilson@example.com", "+628456789012", "password123"),
        DummyUser("David Brown", "david.brown@example.com", "+628567890123", "password123"),
        DummyUser("Lisa Garcia", "lisa.garcia@example.com", "+628678901234", "password123"),
        DummyUser("Tom Davis", "tom.davis@example.com", "+628789012345", "password123"),
        DummyUser("Emma Miller", "emma.miller@example.com", "+628890123456", "password123"),
        DummyUser("Chris Anderson", "chris.anderson@example.com", "+628901234567", "password123"),
        DummyUser("Anna Taylor", "anna.taylor@example.com", "+628012345678", "password123")
    )
    
    suspend fun createDummyUsers(): Result<String> = withContext(Dispatchers.IO) {
        try {
            var successCount = 0
            var errorCount = 0
            
            for (dummyUser in dummyUsers) {
                try {
                    Log.d("DummyUsers", "Creating user: ${dummyUser.name}")
                    FirebaseManager.register(
                        email = dummyUser.email,
                        password = dummyUser.password,
                        name = dummyUser.name,
                        phone = dummyUser.phone
                    )
                    successCount++
                    Log.d("DummyUsers", "✓ Successfully created: ${dummyUser.name}")
                } catch (e: Exception) {
                    errorCount++
                    Log.e("DummyUsers", "✗ Failed to create user ${dummyUser.name}: ${e.message}")
                }
            }
            
            val result = "Dummy users creation completed!\n" +
                    "✓ Success: $successCount users\n" +
                    "✗ Errors: $errorCount users\n" +
                    "Total: ${dummyUsers.size} users"
            
            Result.success(result)
        } catch (e: Exception) {
            Log.e("DummyUsers", "Failed to create dummy users: ${e.message}")
            Result.failure(e)
        }
    }
    
    fun getDummyUserCredentials(): List<String> {
        return dummyUsers.map { 
            "${it.name} - Email: ${it.email} - Password: ${it.password}" 
        }
    }
}
