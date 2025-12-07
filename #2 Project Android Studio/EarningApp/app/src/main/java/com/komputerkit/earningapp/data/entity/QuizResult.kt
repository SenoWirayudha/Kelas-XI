package com.komputerkit.earningapp.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "quiz_results")
data class QuizResult(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val userId: Int,
    val categoryId: Int,
    val totalQuestions: Int,
    val correctAnswers: Int,
    val wrongAnswers: Int,
    val coinsEarned: Int,
    val completedAt: Long = System.currentTimeMillis()
)
