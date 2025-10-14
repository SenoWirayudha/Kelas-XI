package com.komputerkit.wavesoffood.repository

import com.komputerkit.wavesoffood.data.FirebaseManager
import com.komputerkit.wavesoffood.data.Resource
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.model.Status
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class OrderRepository {
    
    suspend fun getUserOrders(): Flow<List<Order>> = flow {
        try {
            val orders = FirebaseManager.getAllOrders()
            emit(orders)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun getAllOrders(): Flow<List<Order>> = flow {
        try {
            val orders = FirebaseManager.getAllOrders()
            emit(orders)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun getOrderById(orderId: String): Flow<Order?> = flow {
        try {
            val order = FirebaseManager.getOrderById(orderId)
            emit(order)
        } catch (e: Exception) {
            emit(null)
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun placeOrder(order: com.komputerkit.wavesoffood.model.Order): Flow<Resource<String>> = flow {
        try {
            emit(Resource.Loading())
            val orderId = FirebaseManager.placeOrder(order)
            emit(Resource.Success(orderId))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to place order"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun updateOrderStatus(orderId: String, status: Status): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.updateOrderStatus(orderId, status)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to update order status"))
        }
    }.flowOn(Dispatchers.IO)
}
