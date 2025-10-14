package com.komputerkit.wavesoffood.repository

import com.komputerkit.wavesoffood.data.FirebaseManager
import com.komputerkit.wavesoffood.data.Resource
import com.komputerkit.wavesoffood.model.Food
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class FoodRepository {
    
    suspend fun getFoods(category: String? = null): Flow<List<Food>> = flow {
        try {
            val foods = if (category != null) {
                FirebaseManager.getFoodsByCategory(category)
            } else {
                FirebaseManager.getAllFoods()
            }
            emit(foods)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun getFoodById(foodId: String): Flow<Food?> = flow {
        try {
            val food = FirebaseManager.getFoodById(foodId)
            emit(food)
        } catch (e: Exception) {
            emit(null)
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun searchFoods(query: String): Flow<List<Food>> = flow {
        try {
            val foods = FirebaseManager.searchFoods(query)
            emit(foods)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
}
