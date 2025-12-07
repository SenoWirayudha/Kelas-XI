package com.komputerkit.socialmediaapp.model

data class Story(
    val id: String = "",
    val imageUrl: String = "",
    val mainImageUrl: String = "",
    val storyImageUrl: String = "",
    val text: String = "",
    val timestamp: Long = 0L,
    val userId: String = "",
    val userName: String = "",
    val userProfileImage: String = "",
    val viewed: Boolean = false,
    val viewedBy: List<String> = emptyList()
)
