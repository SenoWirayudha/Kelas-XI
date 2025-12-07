package com.komputerkit.socialmediaapp.model

data class Post(
    val id: String = "",
    val userId: String = "",
    val userName: String = "",
    val userProfileImage: String = "",
    val postImageUrl: String = "", // Legacy field for Firebase Storage URLs
    val imageUrl: String = "", // Support for both URL links and base64 images
    val videoUrl: String = "", // Support for both URL links and base64 videos
    val mediaType: String = "", // "image" or "video" or "none"
    val description: String = "",
    val likes: Long = 0L,
    val commentsCount: Long = 0L,
    val timestamp: Long = 0L,
    val likedBy: List<String> = emptyList(),
    val hashtags: List<String> = emptyList()
)
