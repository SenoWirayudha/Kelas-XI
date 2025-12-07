package com.komputerkit.earningapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.komputerkit.earningapp.data.entity.QuizQuestion

@Dao
interface QuizQuestionDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestion(question: QuizQuestion): Long
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestions(questions: List<QuizQuestion>)
    
    @Query("SELECT * FROM quiz_questions WHERE categoryId = :categoryId ORDER BY RANDOM() LIMIT :limit")
    suspend fun getQuestionsByCategory(categoryId: Int, limit: Int = 10): List<QuizQuestion>
    
    @Query("SELECT COUNT(*) FROM quiz_questions WHERE categoryId = :categoryId")
    suspend fun getQuestionCountByCategory(categoryId: Int): Int
    
    @Query("SELECT COUNT(*) FROM quiz_questions")
    suspend fun getTotalQuestionsCount(): Int
    
    @Delete
    suspend fun deleteQuestion(question: QuizQuestion)
}
