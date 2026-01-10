package com.komputerkit.moview.data.model

data class Comment(
    val id: Int,
    val reviewId: Int,
    val userId: Int,
    val username: String,
    val userAvatar: String,
    val commentText: String,
    val timeAgo: String,
    val likeCount: Int,
    var isLiked: Boolean = false
)
