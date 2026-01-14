package com.komputerkit.moview.data.model

data class Movie(
    val id: Int,
    val title: String,
    val posterUrl: String,
    val averageRating: Float,
    val genre: String,
    val releaseYear: Int,
    val description: String,
    val backdropUrl: String = "",
    val director: String = "",
    val duration: String = "",
    val pgRating: String = "",
    val watchedCount: String = "0",
    val reviewCount: String = "0",
    val rating5: Int = 0,
    val rating4: Int = 0,
    val rating3: Int = 0,
    val rating2: Int = 0,
    val rating1: Int = 0,
    val cast: List<CastMember> = emptyList(),
    val similarMovies: List<Movie> = emptyList(),
    val hasReview: Boolean = false,
    val reviewId: Int = 0,
    val userRating: Float = 0f,  // User's personal rating (0-5 in 0.5 steps)
    val isLiked: Boolean = false  // Whether user has liked this movie
)

data class CastMember(
    val id: Int,
    val name: String,
    val character: String,
    val photoUrl: String
)
