package com.komputerkit.socialmediaapp.model

data class User(
    val id: String = "",
    val username: String = "",
    val fullName: String = "",
    val displayName: String = "",
    val email: String = "",
    val profileImageUrl: String = "",
    val bio: String = "",
    val followers: List<String> = emptyList(),
    val following: List<String> = emptyList(),
    val followersCount: Long = 0L,
    val followingCount: Long = 0L,
    val postsCount: Long = 0L,
    val isVerified: Boolean = false,
    val createdAt: Long = 0L
)
