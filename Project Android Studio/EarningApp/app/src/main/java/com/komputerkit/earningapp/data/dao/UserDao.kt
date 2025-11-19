package com.komputerkit.earningapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.komputerkit.earningapp.data.entity.User

@Dao
interface UserDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User): Long
    
    @Update
    suspend fun updateUser(user: User)
    
    @Query("SELECT * FROM users WHERE email = :email AND password = :password LIMIT 1")
    suspend fun login(email: String, password: String): User?
    
    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): User?
    
    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: Int): User?
    
    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserByIdLiveData(userId: Int): LiveData<User>
    
    @Query("UPDATE users SET coins = :coins WHERE id = :userId")
    suspend fun updateCoins(userId: Int, coins: Int)
    
    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteUser(userId: Int)
}
