package com.komputerkit.moview.data.repository

import com.komputerkit.moview.data.api.LoginRequest
import com.komputerkit.moview.data.api.RegisterRequest
import com.komputerkit.moview.data.api.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    
    private val apiService = RetrofitClient.movieApiService
    
    suspend fun register(username: String, email: String, password: String): Result<LoginData> = withContext(Dispatchers.IO) {
        try {
            val request = RegisterRequest(username, email, password)
            val response = apiService.register(request)
            
            if (response.success && response.data != null) {
                val loginData = LoginData(
                    userId = response.data.user.id,
                    username = response.data.user.username,
                    email = response.data.user.email,
                    role = response.data.user.role,
                    token = response.data.token,
                    joinedAt = response.data.user.joined_at
                )
                Result.success(loginData)
            } else {
                Result.failure(Exception(response.message ?: "Registration failed"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    suspend fun login(email: String, password: String): Result<LoginData> = withContext(Dispatchers.IO) {
        try {
            val request = LoginRequest(email, password)
            val response = apiService.login(request)
            
            if (response.success && response.data != null) {
                val loginData = LoginData(
                    userId = response.data.user.id,
                    username = response.data.user.username,
                    email = response.data.user.email,
                    role = response.data.user.role,
                    token = response.data.token,
                    joinedAt = response.data.user.joined_at
                )
                Result.success(loginData)
            } else {
                Result.failure(Exception(response.message ?: "Login failed"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    suspend fun logout(): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.logout()
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}

data class LoginData(
    val userId: Int,
    val username: String,
    val email: String,
    val role: String,
    val token: String,
    val joinedAt: String
)
