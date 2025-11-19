package com.komputerkit.earningapp.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class Transaction(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val userId: Int,
    val type: String, // "SPIN", "QUIZ", "WITHDRAWAL"
    val amount: Int,
    val description: String,
    val timestamp: Long = System.currentTimeMillis()
)
