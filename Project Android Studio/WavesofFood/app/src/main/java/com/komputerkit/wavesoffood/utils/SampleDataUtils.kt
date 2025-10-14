package com.komputerkit.wavesoffood.utils

import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.model.Food
import java.util.Date

object SampleDataUtils {
    
    fun populateSampleFoods() {
        val db = FirebaseFirestore.getInstance()
        
        val sampleFoods = listOf(
            Food(
                id = "food1",
                name = "Nasi Goreng Spesial",
                description = "Nasi goreng dengan telur, ayam, dan seafood",
                price = 25000.0,
                imageUrl = "https://example.com/nasi-goreng.jpg",
                category = "Main Course",
                isAvailable = true,
                rating = 4.5f,
                reviewCount = 120,
                createdAt = Date(),
                updatedAt = Date()
            ),
            Food(
                id = "food6",
                name = "Es Teh Manis",
                description = "Minuman teh manis segar dengan es",
                price = 5000.0,
                imageUrl = "https://example.com/es-teh.jpg",
                category = "Beverage",
                isAvailable = true,
                rating = 4.0f,
                reviewCount = 85,
                createdAt = Date(),
                updatedAt = Date()
            ),
            Food(
                id = "food2",
                name = "Gado-Gado",
                description = "Salad sayuran dengan bumbu kacang",
                price = 20000.0,
                imageUrl = "https://example.com/gado-gado.jpg",
                category = "Main Course",
                isAvailable = true,
                rating = 4.3f,
                reviewCount = 95,
                createdAt = Date(),
                updatedAt = Date()
            ),
            Food(
                id = "food3",
                name = "Rendang",
                description = "Daging sapi dengan bumbu rendang khas Padang",
                price = 35000.0,
                imageUrl = "https://example.com/rendang.jpg",
                category = "Main Course",
                isAvailable = true,
                rating = 4.8f,
                reviewCount = 200,
                createdAt = Date(),
                updatedAt = Date()
            ),
            Food(
                id = "food4",
                name = "Sate Ayam",
                description = "Sate ayam dengan bumbu kacang dan lontong",
                price = 30000.0,
                imageUrl = "https://example.com/sate-ayam.jpg",
                category = "Main Course",
                isAvailable = true,
                rating = 4.6f,
                reviewCount = 150,
                createdAt = Date(),
                updatedAt = Date()
            ),
            Food(
                id = "food5",
                name = "Es Cendol",
                description = "Minuman segar dengan cendol, santan, dan gula merah",
                price = 8000.0,
                imageUrl = "https://example.com/es-cendol.jpg",
                category = "Beverage",
                isAvailable = true,
                rating = 4.2f,
                reviewCount = 75,
                createdAt = Date(),
                updatedAt = Date()
            )
        )
        
        sampleFoods.forEach { food ->
            db.collection("foods").document(food.id).set(food)
        }
    }
}
