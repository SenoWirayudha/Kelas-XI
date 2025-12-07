package com.komputerkit.earningapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.komputerkit.earningapp.data.entity.QuizCategory

@Dao
interface QuizCategoryDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: QuizCategory): Long
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategories(categories: List<QuizCategory>)
    
    @Query("SELECT * FROM quiz_categories ORDER BY name ASC")
    fun getAllCategories(): LiveData<List<QuizCategory>>
    
    @Query("SELECT * FROM quiz_categories WHERE id = :categoryId")
    suspend fun getCategoryById(categoryId: Int): QuizCategory?
    
    @Query("SELECT COUNT(*) FROM quiz_categories")
    suspend fun getCategoriesCount(): Int
    
    @Delete
    suspend fun deleteCategory(category: QuizCategory)
}
