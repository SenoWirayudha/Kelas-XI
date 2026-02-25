package com.komputerkit.moview.data.model

data class LikedReview(
    val reviewId: Int,
    val userId: Int,
    val username: String,
    val displayName: String?,
    val profilePhoto: String,
    val rating: Float
)
