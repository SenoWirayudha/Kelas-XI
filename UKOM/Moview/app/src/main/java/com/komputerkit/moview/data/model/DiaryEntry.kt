package com.komputerkit.moview.data.model

data class DiaryEntry(
    val id: Int,
    val movie: Movie,
    val watchedDate: String,
    val dateLabel: String,
    val monthYear: String,
    val rating: Int,
    val hasReview: Boolean,
    val isLiked: Boolean
)
