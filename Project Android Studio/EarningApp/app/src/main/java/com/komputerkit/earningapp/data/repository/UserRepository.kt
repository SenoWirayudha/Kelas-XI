package com.komputerkit.earningapp.data.repository

import androidx.lifecycle.LiveData
import com.komputerkit.earningapp.data.dao.UserDao
import com.komputerkit.earningapp.data.entity.User

class UserRepository(private val userDao: UserDao) {
    
    suspend fun insertUser(user: User): Long {
        return userDao.insertUser(user)
    }
    
    suspend fun updateUser(user: User) {
        userDao.updateUser(user)
    }
    
    suspend fun login(email: String, password: String): User? {
        return userDao.login(email, password)
    }
    
    suspend fun getUserByEmail(email: String): User? {
        return userDao.getUserByEmail(email)
    }
    
    suspend fun getUserById(userId: Int): User? {
        return userDao.getUserById(userId)
    }
    
    fun getUserByIdLiveData(userId: Int): LiveData<User> {
        return userDao.getUserByIdLiveData(userId)
    }
    
    suspend fun updateCoins(userId: Int, coins: Int) {
        userDao.updateCoins(userId, coins)
    }
    
    suspend fun deleteUser(userId: Int) {
        userDao.deleteUser(userId)
    }
}
