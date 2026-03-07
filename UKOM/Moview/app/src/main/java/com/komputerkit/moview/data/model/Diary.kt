package com.komputerkit.moview.data.model

/**
 * Diary model for user film activity screen
 */
data class Diary(
    val diary_id: Int,
    val movie_id: Int,
    val title: String,
    val year: Int,
    val poster_path: String?,
    val watched_at: String,
    val note: String?,
    val rating: Int,
    val is_liked: Boolean,
    val is_rewatched: Boolean,
    val review_id: Int,
    val review_text: String?,
    val type: String  // "review" or "log"
)
