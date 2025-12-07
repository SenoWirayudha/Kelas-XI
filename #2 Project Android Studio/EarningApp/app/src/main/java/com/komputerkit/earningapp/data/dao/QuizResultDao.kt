package com.komputerkit.earningapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.komputerkit.earningapp.data.entity.QuizResult

@Dao
interface QuizResultDao {
    
    @Insert
    suspend fun insertResult(result: QuizResult): Long
    
    @Query("SELECT * FROM quiz_results WHERE userId = :userId ORDER BY completedAt DESC")
    fun getResultsByUser(userId: Int): LiveData<List<QuizResult>>
    
    @Query("SELECT * FROM quiz_results WHERE userId = :userId AND categoryId = :categoryId ORDER BY completedAt DESC")
    fun getResultsByUserAndCategory(userId: Int, categoryId: Int): LiveData<List<QuizResult>>
    
    @Query("SELECT SUM(coinsEarned) FROM quiz_results WHERE userId = :userId")
    suspend fun getTotalCoinsFromQuiz(userId: Int): Int?
    
    @Query("SELECT COUNT(*) FROM quiz_results WHERE userId = :userId")
    suspend fun getTotalQuizzesTaken(userId: Int): Int
    
    @Query("SELECT SUM(correctAnswers) FROM quiz_results WHERE userId = :userId")
    suspend fun getTotalCorrectAnswers(userId: Int): Int?
    
    @Delete
    suspend fun deleteResult(result: QuizResult)
}
