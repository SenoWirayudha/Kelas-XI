package com.komputerkit.moview.data.model

/**
 * Review data model for user film activity screen
 */
data class ReviewData(
    val review_id: Int,
    val movie_id: Int,
    val title: String,
    val year: Int,
    val poster_path: String?,
    val rating: Int,
    val is_liked: Boolean,
    val watched_at: String?,
    val review_title: String?,
    val content: String,
    val is_spoiler: Boolean,
    val created_at: String,
    val diary_id: Int = 0
)
