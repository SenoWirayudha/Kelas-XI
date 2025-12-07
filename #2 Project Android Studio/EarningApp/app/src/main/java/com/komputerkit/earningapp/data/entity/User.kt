package com.komputerkit.earningapp.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val username: String,
    val email: String,
    val password: String,
    val coins: Int = 100,
    val createdAt: Long = System.currentTimeMillis()
)
