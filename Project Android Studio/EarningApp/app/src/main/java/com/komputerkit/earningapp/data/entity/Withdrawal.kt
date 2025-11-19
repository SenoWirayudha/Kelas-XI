package com.komputerkit.earningapp.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "withdrawals")
data class Withdrawal(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val userId: Int,
    val amount: Int,
    val paymentMethod: String,
    val accountNumber: String,
    val status: String = "PENDING", // PENDING, PROCESSING, COMPLETED, FAILED
    val requestDate: Long = System.currentTimeMillis(),
    val processedDate: Long? = null
)
