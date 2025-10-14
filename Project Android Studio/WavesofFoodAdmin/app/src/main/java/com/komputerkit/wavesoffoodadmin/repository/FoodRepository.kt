package com.komputerkit.wavesoffoodadmin.repository

import com.google.firebase.firestore.Query
import com.komputerkit.wavesoffoodadmin.FirebaseHelper
import com.komputerkit.wavesoffoodadmin.model.MenuItem
import kotlinx.coroutines.tasks.await

class FoodRepository {
    
    private val foodsCollection = FirebaseHelper.getFoodsCollection()
    
    // Get all foods
    suspend fun getAllFoods(): List<MenuItem> {
        return try {
            val snapshot = foodsCollection
                .orderBy("name", Query.Direction.ASCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { document ->
                try {
                    // Manual mapping to handle field name inconsistencies
                    val data = document.data ?: return@mapNotNull null
                    
                    MenuItem(
                        id = document.id,
                        name = data["name"] as? String ?: "",
                        description = data["description"] as? String ?: "",
                        price = (data["price"] as? Number)?.toDouble() ?: 0.0,
                        category = data["category"] as? String ?: "",
                        imageUrl = data["imageUrl"] as? String ?: "",
                        // Handle both 'isAvailable' and 'available' field names
                        isAvailable = (data["isAvailable"] as? Boolean) 
                                    ?: (data["available"] as? Boolean) 
                                    ?: true,
                        rating = (data["rating"] as? Number)?.toDouble() ?: 0.0,
                        reviewCount = (data["reviewCount"] as? Number)?.toInt() ?: 0,
                        createdAt = (data["createdAt"] as? com.google.firebase.Timestamp)?.toDate()
                    )
                } catch (e: Exception) {
                    android.util.Log.e("FoodRepository", "Error mapping food ${document.id}: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // Get foods by category
    suspend fun getFoodsByCategory(category: String): List<MenuItem> {
        return try {
            val snapshot = foodsCollection
                .whereEqualTo("category", category)
                .orderBy("name", Query.Direction.ASCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { document ->
                try {
                    val data = document.data ?: return@mapNotNull null
                    
                    MenuItem(
                        id = document.id,
                        name = data["name"] as? String ?: "",
                        description = data["description"] as? String ?: "",
                        price = (data["price"] as? Number)?.toDouble() ?: 0.0,
                        category = data["category"] as? String ?: "",
                        imageUrl = data["imageUrl"] as? String ?: "",
                        isAvailable = (data["isAvailable"] as? Boolean) 
                                    ?: (data["available"] as? Boolean) 
                                    ?: true,
                        rating = (data["rating"] as? Number)?.toDouble() ?: 0.0,
                        reviewCount = (data["reviewCount"] as? Number)?.toInt() ?: 0,
                        createdAt = (data["createdAt"] as? com.google.firebase.Timestamp)?.toDate()
                    )
                } catch (e: Exception) {
                    android.util.Log.e("FoodRepository", "Error mapping food ${document.id}: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    suspend fun getFoodById(foodId: String): MenuItem? {
        return try {
            val snapshot = foodsCollection.document(foodId).get().await()
            val data = snapshot.data ?: return null
            
            MenuItem(
                id = snapshot.id,
                name = data["name"] as? String ?: "",
                description = data["description"] as? String ?: "",
                price = (data["price"] as? Number)?.toDouble() ?: 0.0,
                category = data["category"] as? String ?: "",
                imageUrl = data["imageUrl"] as? String ?: "",
                isAvailable = (data["isAvailable"] as? Boolean) 
                            ?: (data["available"] as? Boolean) 
                            ?: true,
                rating = (data["rating"] as? Number)?.toDouble() ?: 0.0,
                reviewCount = (data["reviewCount"] as? Number)?.toInt() ?: 0,
                createdAt = (data["createdAt"] as? com.google.firebase.Timestamp)?.toDate()
            )
        } catch (e: Exception) {
            android.util.Log.e("FoodRepository", "Error getting food $foodId: ${e.message}")
            null
        }
    }
    
    // Add new food
    suspend fun addFood(food: MenuItem): Boolean {
        return try {
            if (food.id.isNotEmpty()) {
                foodsCollection.document(food.id).set(food).await()
            } else {
                foodsCollection.add(food).await()
            }
            true
        } catch (e: Exception) {
            false
        }
    }
    
    // Update existing food
    suspend fun updateFood(foodId: String, food: MenuItem): Boolean {
        return try {
            foodsCollection.document(foodId).set(food).await()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    // Update food availability
    suspend fun updateFoodAvailability(foodId: String, isAvailable: Boolean): Boolean {
        return try {
            foodsCollection.document(foodId)
                .update("isAvailable", isAvailable)
                .await()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    // Migrate data to fix field name inconsistencies
    suspend fun migrateAvailabilityFields(): Boolean {
        return try {
            val snapshot = foodsCollection.get().await()
            
            for (document in snapshot.documents) {
                val data = document.data ?: continue
                
                // Check if document has 'available' field but no 'isAvailable' field
                if (data.containsKey("available") && !data.containsKey("isAvailable")) {
                    val availableValue = data["available"] as? Boolean ?: true
                    
                    // Update document to use 'isAvailable' field
                    document.reference.update(
                        mapOf(
                            "isAvailable" to availableValue,
                            "available" to com.google.firebase.firestore.FieldValue.delete()
                        )
                    ).await()
                    
                    android.util.Log.d("FoodRepository", "Migrated document ${document.id}: available -> isAvailable")
                }
            }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FoodRepository", "Error migrating availability fields: ${e.message}")
            false
        }
    }
    
    // Delete food
    suspend fun deleteFood(foodId: String): Boolean {
        return try {
            foodsCollection.document(foodId).delete().await()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    // Get available food categories
    suspend fun getFoodCategories(): List<String> {
        return try {
            val snapshot = foodsCollection
                .orderBy("category", Query.Direction.ASCENDING)
                .get()
                .await()
            
            val categories = mutableSetOf<String>()
            snapshot.documents.forEach { document ->
                val category = document.data?.get("category") as? String
                if (!category.isNullOrEmpty()) {
                    categories.add(category)
                }
            }
            
            categories.toList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
