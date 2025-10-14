package com.komputerkit.wavesoffood.data

import com.komputerkit.wavesoffood.model.Food
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.model.Status
import com.komputerkit.wavesoffood.model.User
import com.komputerkit.wavesoffood.model.Address
import com.komputerkit.wavesoffood.model.CartItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class FoodRepository {
    suspend fun getAllFoods(): Flow<Resource<List<Food>>> = flow {
        emit(Resource.Loading())
        try {
            val foods = FirebaseManager.getAllFoods()
            emit(Resource.Success(foods))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun getFoodsByCategory(category: String): Flow<Resource<List<Food>>> = flow {
        emit(Resource.Loading())
        try {
            val foods = if (category == Food.CATEGORY_ALL) {
                FirebaseManager.getAllFoods()
            } else {
                FirebaseManager.getFoodsByCategory(category)
            }
            emit(Resource.Success(foods))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun getPopularFoods(): Flow<Resource<List<Food>>> = flow {
        emit(Resource.Loading())
        try {
            val foods = FirebaseManager.getPopularFoods()
            emit(Resource.Success(foods))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)
}

class OrderRepository {
    suspend fun createOrder(order: Order): Flow<Resource<String>> = flow {
        emit(Resource.Loading())
        try {
            val orderId = FirebaseManager.createOrder(order)
            emit(Resource.Success(orderId))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun getUserOrders(userId: String): Flow<Resource<List<Order>>> = flow {
        emit(Resource.Loading())
        try {
            val orders = FirebaseManager.getUserOrders(userId)
            emit(Resource.Success(orders))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun updateOrderStatus(orderId: String, status: Status): Flow<Resource<Unit>> = flow {
        emit(Resource.Loading())
        try {
            FirebaseManager.updateOrderStatus(orderId, status)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)
}

class UserRepository {
    suspend fun getCurrentUser(): Flow<Resource<User>> = flow {
        emit(Resource.Loading())
        try {
            val user = FirebaseManager.getCurrentUser()
            if (user != null) {
                emit(Resource.Success(user))
            } else {
                emit(Resource.Error("User not found"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)

    suspend fun updateUserProfile(user: User): Flow<Resource<Unit>> = flow {
        emit(Resource.Loading())
        try {
            FirebaseManager.updateUserProfile(user)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An error occurred"))
        }
    }.flowOn(Dispatchers.IO)
}
