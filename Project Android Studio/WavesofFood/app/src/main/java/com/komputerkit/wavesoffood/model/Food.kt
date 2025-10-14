package com.komputerkit.wavesoffood.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

@Parcelize
data class Food(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val price: Double = 0.0,
    val imageUrl: String = "",
    val category: String = "",
    val isAvailable: Boolean = true,
    val rating: Float = 0f,
    val reviewCount: Int = 0,
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
) : Parcelable {
    companion object {
        const val CATEGORY_ALL = "All"
        const val CATEGORY_MAIN_COURSE = "Main Course"
        const val CATEGORY_APPETIZER = "Appetizer"
        const val CATEGORY_DESSERT = "Dessert"
        const val CATEGORY_BEVERAGE = "Beverage"

        val categories = listOf(
            CATEGORY_ALL,
            CATEGORY_MAIN_COURSE,
            CATEGORY_APPETIZER,
            CATEGORY_DESSERT,
            CATEGORY_BEVERAGE
        )
    }
}
