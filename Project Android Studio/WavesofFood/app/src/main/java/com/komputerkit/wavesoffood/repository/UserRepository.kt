package com.komputerkit.wavesoffood.repository

import com.komputerkit.wavesoffood.data.FirebaseManager
import com.komputerkit.wavesoffood.data.Resource
import com.komputerkit.wavesoffood.model.User
import com.komputerkit.wavesoffood.model.Address
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class UserRepository {
    
    suspend fun login(email: String, password: String): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())
            val user = FirebaseManager.login(email, password)
            emit(Resource.Success(user))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Login failed"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun register(email: String, password: String, name: String, phone: String = ""): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())
            val user = FirebaseManager.register(email, password, name, phone)
            emit(Resource.Success(user))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Registration failed"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun logout(): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.logout()
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Logout failed"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun resetPassword(email: String): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.resetPassword(email)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Password reset failed"))
        }
    }.flowOn(Dispatchers.IO)

    fun isUserLoggedIn(): Boolean {
        return FirebaseManager.isUserLoggedIn()
    }
    
    suspend fun getUserProfile(): Flow<User?> = flow {
        try {
            val user = FirebaseManager.getCurrentUser()
            emit(user)
        } catch (e: Exception) {
            emit(null)
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun getCurrentUser(): Flow<Resource<User?>> = flow {
        try {
            emit(Resource.Loading())
            val user = FirebaseManager.getCurrentUser()
            emit(Resource.Success(user))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to get user"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun updateUserProfile(user: User): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.updateUserProfile(user)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to update profile"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun getUserAddresses(): Flow<List<Address>> = flow {
        try {
            val addresses = FirebaseManager.getUserAddresses()
            emit(addresses)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun addAddress(address: Address): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.addAddress(address)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to add address"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun updateAddress(addressId: String, address: Address): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.updateAddress(addressId, address)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to update address"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun deleteAddress(addressId: String): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.deleteAddress(addressId)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to delete address"))
        }
    }.flowOn(Dispatchers.IO)
}
