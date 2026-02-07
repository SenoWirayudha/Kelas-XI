package com.komputerkit.moview.data.model

data class Review(
    val id: Int,
    val movie: Movie,
    val rating: Float,
    val reviewText: String,
    val reviewDate: String,
    val dateLabel: String,
    val userId: Int = 0,
    val movieId: Int = 0,
    val reviewId: Int = 0,
    val timestamp: Long = 0L,
    val likeCount: Int = 0,
    val isRewatch: Boolean = false,
    val isLiked: Boolean = false,
    val watchedAt: String? = null,
    val userName: String = "",
    val userAvatar: String = "",
    val timeAgo: String = "",
    val commentCount: Int = 0,
    val hasTag: Boolean = false,
    val tag: String = ""
)
