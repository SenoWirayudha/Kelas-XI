package com.komputerkit.earningapp.data.repository

import androidx.lifecycle.LiveData
import com.komputerkit.earningapp.data.dao.QuizCategoryDao
import com.komputerkit.earningapp.data.dao.QuizQuestionDao
import com.komputerkit.earningapp.data.dao.QuizResultDao
import com.komputerkit.earningapp.data.entity.QuizCategory
import com.komputerkit.earningapp.data.entity.QuizQuestion
import com.komputerkit.earningapp.data.entity.QuizResult

class QuizRepository(
    private val categoryDao: QuizCategoryDao,
    private val questionDao: QuizQuestionDao,
    private val resultDao: QuizResultDao
) {
    
    // Category operations
    suspend fun insertCategory(category: QuizCategory): Long {
        return categoryDao.insertCategory(category)
    }
    
    suspend fun insertCategories(categories: List<QuizCategory>) {
        categoryDao.insertCategories(categories)
    }
    
    fun getAllCategories(): LiveData<List<QuizCategory>> {
        return categoryDao.getAllCategories()
    }
    
    suspend fun getCategoryById(categoryId: Int): QuizCategory? {
        return categoryDao.getCategoryById(categoryId)
    }
    
    suspend fun getCategoriesCount(): Int {
        return categoryDao.getCategoriesCount()
    }
    
    // Question operations
    suspend fun insertQuestion(question: QuizQuestion): Long {
        return questionDao.insertQuestion(question)
    }
    
    suspend fun insertQuestions(questions: List<QuizQuestion>) {
        questionDao.insertQuestions(questions)
    }
    
    suspend fun getQuestionsByCategory(categoryId: Int, limit: Int = 10): List<QuizQuestion> {
        return questionDao.getQuestionsByCategory(categoryId, limit)
    }
    
    suspend fun getQuestionCountByCategory(categoryId: Int): Int {
        return questionDao.getQuestionCountByCategory(categoryId)
    }
    
    // Result operations
    suspend fun insertResult(result: QuizResult): Long {
        return resultDao.insertResult(result)
    }
    
    fun getResultsByUser(userId: Int): LiveData<List<QuizResult>> {
        return resultDao.getResultsByUser(userId)
    }
    
    fun getResultsByUserAndCategory(userId: Int, categoryId: Int): LiveData<List<QuizResult>> {
        return resultDao.getResultsByUserAndCategory(userId, categoryId)
    }
    
    suspend fun getTotalCoinsFromQuiz(userId: Int): Int {
        return resultDao.getTotalCoinsFromQuiz(userId) ?: 0
    }
    
    suspend fun getTotalQuizzesTaken(userId: Int): Int {
        return resultDao.getTotalQuizzesTaken(userId)
    }
    
    suspend fun getTotalCorrectAnswers(userId: Int): Int {
        return resultDao.getTotalCorrectAnswers(userId) ?: 0
    }
}
