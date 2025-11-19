package com.komputerkit.earningapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.komputerkit.earningapp.data.entity.Withdrawal

@Dao
interface WithdrawalDao {
    
    @Insert
    suspend fun insertWithdrawal(withdrawal: Withdrawal): Long
    
    @Update
    suspend fun updateWithdrawal(withdrawal: Withdrawal)
    
    @Query("SELECT * FROM withdrawals WHERE userId = :userId ORDER BY requestDate DESC")
    fun getWithdrawalsByUser(userId: Int): LiveData<List<Withdrawal>>
    
    @Query("SELECT * FROM withdrawals WHERE userId = :userId AND status = :status ORDER BY requestDate DESC")
    fun getWithdrawalsByStatus(userId: Int, status: String): LiveData<List<Withdrawal>>
    
    @Query("SELECT SUM(amount) FROM withdrawals WHERE userId = :userId AND status = 'COMPLETED'")
    suspend fun getTotalWithdrawn(userId: Int): Int?
    
    @Delete
    suspend fun deleteWithdrawal(withdrawal: Withdrawal)
}
