package com.komputerkit.earningapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.komputerkit.earningapp.data.entity.Transaction

@Dao
interface TransactionDao {
    
    @Insert
    suspend fun insertTransaction(transaction: Transaction): Long
    
    @Query("SELECT * FROM transactions WHERE userId = :userId ORDER BY timestamp DESC")
    fun getTransactionsByUser(userId: Int): LiveData<List<Transaction>>
    
    @Query("SELECT * FROM transactions WHERE userId = :userId AND type = :type ORDER BY timestamp DESC")
    fun getTransactionsByType(userId: Int, type: String): LiveData<List<Transaction>>
    
    @Query("SELECT SUM(amount) FROM transactions WHERE userId = :userId AND type = 'SPIN'")
    suspend fun getTotalSpinEarnings(userId: Int): Int?
    
    @Query("SELECT COUNT(*) FROM transactions WHERE userId = :userId AND type = 'SPIN'")
    suspend fun getTotalSpinCount(userId: Int): Int
    
    @Delete
    suspend fun deleteTransaction(transaction: Transaction)
}
