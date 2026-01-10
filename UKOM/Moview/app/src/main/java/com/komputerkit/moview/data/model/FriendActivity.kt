package com.komputerkit.moview.data.model

data class FriendActivity(
    val id: Int,
    val user: User,
    val movie: Movie,
    val rating: Float,
    val likeCount: Int,
    val isRewatch: Boolean,
    val hasReview: Boolean,
    val reviewText: String = "",
    val timestamp: Long
)
