package com.komputerkit.earningapp.data.repository

import androidx.lifecycle.LiveData
import com.komputerkit.earningapp.data.dao.TransactionDao
import com.komputerkit.earningapp.data.entity.Transaction

class TransactionRepository(private val transactionDao: TransactionDao) {
    
    suspend fun insertTransaction(transaction: Transaction): Long {
        return transactionDao.insertTransaction(transaction)
    }
    
    fun getTransactionsByUser(userId: Int): LiveData<List<Transaction>> {
        return transactionDao.getTransactionsByUser(userId)
    }
    
    fun getTransactionsByType(userId: Int, type: String): LiveData<List<Transaction>> {
        return transactionDao.getTransactionsByType(userId, type)
    }
    
    suspend fun getTotalSpinEarnings(userId: Int): Int {
        return transactionDao.getTotalSpinEarnings(userId) ?: 0
    }
    
    suspend fun getTotalSpinCount(userId: Int): Int {
        return transactionDao.getTotalSpinCount(userId)
    }
    
    suspend fun deleteTransaction(transaction: Transaction) {
        transactionDao.deleteTransaction(transaction)
    }
}
