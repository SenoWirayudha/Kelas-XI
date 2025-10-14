package com.komputerkit.wavesoffood.repository

import com.komputerkit.wavesoffood.data.FirebaseManager
import com.komputerkit.wavesoffood.data.Resource
import com.komputerkit.wavesoffood.model.CartItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class CartRepository {
    
    suspend fun getCartItems(): Flow<List<CartItem>> = flow {
        try {
            val cartItems = FirebaseManager.getCartItems()
            emit(cartItems)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun addToCart(foodId: String, quantity: Int): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.addToCart(foodId, quantity)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to add to cart"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun updateCartItemQuantity(cartItemId: String, quantity: Int): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.updateCartItemQuantity(cartItemId, quantity)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to update cart"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun removeFromCart(cartItemId: String): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.removeFromCart(cartItemId)
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to remove from cart"))
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun clearCart(): Flow<Resource<Unit>> = flow {
        try {
            emit(Resource.Loading())
            FirebaseManager.clearCart()
            emit(Resource.Success(Unit))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to clear cart"))
        }
    }.flowOn(Dispatchers.IO)
}
