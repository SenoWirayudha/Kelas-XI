package com.komputerkit.moview.ui.common

import com.komputerkit.moview.data.model.Movie
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

enum class MovieSortMode {
    DATE,
    RELEASE_YEAR,
    RATING
}

enum class RatingSource {
    AVERAGE,
    YOUR
}

data class MovieFilterState(
    val sortMode: MovieSortMode = MovieSortMode.RELEASE_YEAR,
    val releaseYearDescending: Boolean = true,
    val ratingSource: RatingSource = RatingSource.AVERAGE,
    val ratingDescending: Boolean = true,
    val selectedYear: Int? = null,
    val selectedGenre: String? = null,
    val selectedCountry: String? = null,
    val selectedLanguage: String? = null
)

object MovieFilterUtils {

    fun getDecades(): List<Int> = (1900..2020 step 10).toList()

    fun getYearsInDecade(decadeStart: Int): List<Int> = (decadeStart..(decadeStart + 9)).toList()

    fun applyFilters(movies: List<Movie>, state: MovieFilterState): List<Movie> {
        var filtered = movies

        state.selectedYear?.let { year ->
            filtered = filtered.filter { it.releaseYear == year }
        }

        state.selectedGenre?.takeIf { it.isNotBlank() }?.let { genre ->
            filtered = filtered.filter { movie ->
                movie.genres.any { it.equals(genre, ignoreCase = true) }
            }
        }

        state.selectedCountry?.takeIf { it.isNotBlank() }?.let { country ->
            filtered = filtered.filter { movie ->
                movie.countries.any { it.equals(country, ignoreCase = true) }
            }
        }

        state.selectedLanguage?.takeIf { it.isNotBlank() }?.let { language ->
            filtered = filtered.filter { movie ->
                movie.languages.any { it.equals(language, ignoreCase = true) }
            }
        }

        return when (state.sortMode) {
            MovieSortMode.DATE -> filtered.sortedByDescending { parseToEpoch(it.activityAtRaw) }
            MovieSortMode.RELEASE_YEAR -> {
                if (state.releaseYearDescending) {
                    filtered.sortedByDescending { it.releaseYear ?: 0 }
                } else {
                    filtered.sortedBy { it.releaseYear ?: Int.MAX_VALUE }
                }
            }
            MovieSortMode.RATING -> {
                val withScore = filtered.map { movie ->
                    val score = if (state.ratingSource == RatingSource.AVERAGE) {
                        movie.averageRating ?: 0f
                    } else {
                        movie.userRating
                    }
                    movie to score
                }

                if (state.ratingDescending) {
                    withScore.sortedByDescending { it.second }.map { it.first }
                } else {
                    withScore.sortedBy { it.second }.map { it.first }
                }
            }
        }
    }

    private fun parseToEpoch(raw: String?): Long {
        if (raw.isNullOrBlank()) return 0L

        return try {
            OffsetDateTime.parse(raw).toEpochSecond()
        } catch (_: Exception) {
            try {
                LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
            } catch (_: Exception) {
                try {
                    LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")).atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
                } catch (_: Exception) {
                    0L
                }
            }
        }
    }
}
