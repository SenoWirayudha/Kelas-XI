package com.komputerkit.moview.data.model

data class TheatricalMovie(
    val id: Int,
    val title: String,
    val posterUrl: String?,
    val releaseDate: String?,   // e.g. "2025-07-18", null if unknown
    val isPreorder: Boolean,
    val hasSchedule: Boolean,
    val genre: String? = null,
    val year: Int? = null,
    val ageRating: String? = null
)
