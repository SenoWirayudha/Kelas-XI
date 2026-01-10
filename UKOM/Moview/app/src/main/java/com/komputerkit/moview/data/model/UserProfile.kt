package com.komputerkit.moview.data.model

data class UserProfile(
    val id: Int,
    val username: String,
    val avatarUrl: String,
    val bio: String? = null
)
