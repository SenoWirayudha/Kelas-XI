package com.komputerkit.earningapp.data.repository

import androidx.lifecycle.LiveData
import com.komputerkit.earningapp.data.dao.WithdrawalDao
import com.komputerkit.earningapp.data.entity.Withdrawal

class WithdrawalRepository(private val withdrawalDao: WithdrawalDao) {
    
    suspend fun insertWithdrawal(withdrawal: Withdrawal): Long {
        return withdrawalDao.insertWithdrawal(withdrawal)
    }
    
    suspend fun updateWithdrawal(withdrawal: Withdrawal) {
        withdrawalDao.updateWithdrawal(withdrawal)
    }
    
    fun getWithdrawalsByUser(userId: Int): LiveData<List<Withdrawal>> {
        return withdrawalDao.getWithdrawalsByUser(userId)
    }
    
    fun getWithdrawalsByStatus(userId: Int, status: String): LiveData<List<Withdrawal>> {
        return withdrawalDao.getWithdrawalsByStatus(userId, status)
    }
    
    suspend fun getTotalWithdrawn(userId: Int): Int {
        return withdrawalDao.getTotalWithdrawn(userId) ?: 0
    }
    
    suspend fun deleteWithdrawal(withdrawal: Withdrawal) {
        withdrawalDao.deleteWithdrawal(withdrawal)
    }
}
