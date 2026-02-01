package com.komputerkit.moview.data.model

import com.komputerkit.moview.data.api.CrewJobDto
import com.komputerkit.moview.data.api.StreamingServiceDto
import com.komputerkit.moview.data.api.TheatricalServiceDto

data class Movie(
    val id: Int,
    val title: String?,
    val posterUrl: String?,
    val averageRating: Float?,
    val genre: String?,
    val releaseYear: Int?,
    val description: String?,
    val backdropUrl: String? = null,
    val trailerUrl: String? = null,
    val director: String? = null,
    val directorId: Int? = null,
    val duration: String? = null,
    val pgRating: String? = null,
    val watchedCount: String? = null,
    val reviewCount: String? = null,
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
    val isLiked: Boolean = false,  // Whether user has liked this movie
    val streamingServices: List<StreamingServiceDto> = emptyList(),
    val theatricalServices: List<TheatricalServiceDto> = emptyList(),
    val crew: List<CrewJobDto> = emptyList(),
    val originalLanguage: String? = null,
    val spokenLanguages: List<String> = emptyList(),
    val productionCountries: List<String> = emptyList(),
    val productionCompanies: List<String> = emptyList()
)

data class CastMember(
    val id: Int,
    val name: String,
    val character: String,
    val photoUrl: String
)
