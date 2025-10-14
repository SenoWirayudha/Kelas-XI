package com.komputerkit.mvvmdemo.repository

import com.komputerkit.mvvmdemo.model.User
import kotlinx.coroutines.delay

/**
 * Repository class for User data operations
 * Simulates data source (API calls, database operations, etc.)
 */
class UserRepository {
    
    /**
     * Fetches user data from a simulated data source
     * Simulates an API call with a 2-second delay
     * @return User object with hardcoded data
     */
    suspend fun fetchUser(): User {
        // Simulate API call delay
        delay(2000)
        
        // Return hardcoded user data
        return User(
            name = "John Doe",
            age = 30
        )
    }
}