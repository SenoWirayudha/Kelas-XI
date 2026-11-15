package com.komputerkit.moview.ui.common

import com.komputerkit.moview.data.model.Movie
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

enum class MovieSortMode {
    /** Keep the caller's order (list drag order). */
    LIST_ORDER,
    DATE,
    RELEASE_YEAR,
    RATING,
    /** Most watched across all users (Movie.popularity = all-time watched count). */
    POPULARITY
}

enum class RatingSource {
    AVERAGE,
    YOUR
}

/** Duration filter: films without duration data match neither option. */
enum class DurationFilter {
    FEATURE_LENGTH,
    SHORT_FILM;

    fun matches(duration: String?): Boolean {
        val minutes = parseMinutes(duration) ?: return false
        return when (this) {
            FEATURE_LENGTH -> minutes >= FEATURE_LENGTH_MINUTES
            SHORT_FILM -> minutes < FEATURE_LENGTH_MINUTES
        }
    }

    companion object {
        const val FEATURE_LENGTH_MINUTES = 60

        /** "120m", "120", "2h 5m" → minutes; null when there is no usable number. */
        fun parseMinutes(duration: String?): Int? {
            val raw = duration?.trim().orEmpty()
            if (raw.isEmpty()) return null

            val hours = Regex("(\\d+)\\s*h", RegexOption.IGNORE_CASE).find(raw)?.groupValues?.get(1)?.toIntOrNull() ?: 0
            val minutes = Regex("(\\d+)\\s*m", RegexOption.IGNORE_CASE).find(raw)?.groupValues?.get(1)?.toIntOrNull()
                ?: raw.filter { it.isDigit() }.toIntOrNull()

            val total = hours * 60 + (minutes ?: 0)
            return total.takeIf { it > 0 }
        }
    }
}

data class MovieFilterState(
    val sortMode: MovieSortMode = MovieSortMode.RELEASE_YEAR,
    val releaseYearDescending: Boolean = true,
    val ratingSource: RatingSource = RatingSource.AVERAGE,
    val ratingDescending: Boolean = true,
    val selectedYear: Int? = null,
    val selectedGenre: String? = null,
    val selectedCountry: String? = null,
    val selectedLanguage: String? = null,
    val selectedTheme: String? = null,
    val selectedProductionHouse: String? = null,
    val durationFilter: DurationFilter? = null
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

        state.selectedTheme?.takeIf { it.isNotBlank() }?.let { theme ->
            filtered = filtered.filter { movie ->
                movie.themes.any { it.equals(theme, ignoreCase = true) }
            }
        }

        state.selectedProductionHouse?.takeIf { it.isNotBlank() }?.let { house ->
            filtered = filtered.filter { movie ->
                movie.productionCompanies.any { it.equals(house, ignoreCase = true) }
            }
        }

        state.durationFilter?.let { duration ->
            filtered = filtered.filter { duration.matches(it.duration) }
        }

        return when (state.sortMode) {
            // Stable: the incoming order (list drag order) is already the answer.
            MovieSortMode.LIST_ORDER -> filtered
            MovieSortMode.DATE -> filtered.sortedByDescending { parseToEpoch(it.activityAtRaw) }
            MovieSortMode.POPULARITY -> filtered.sortedByDescending { it.popularity ?: 0 }
            MovieSortMode.RELEASE_YEAR -> {
                if (state.releaseYearDescending) {
                    filtered.sortedWith(compareByDescending { releaseSortKey(it, missing = 0L) })
                } else {
                    filtered.sortedWith(compareBy { releaseSortKey(it, missing = Long.MAX_VALUE) })
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

    private fun releaseSortKey(movie: Movie, missing: Long): Long {
        val dateEpoch = parseToEpoch(movie.primaryReleaseDate)
        if (dateEpoch > 0L) return dateEpoch
        val year = movie.releaseYear ?: return missing
        return try {
            java.time.LocalDate.of(year, 1, 1)
                .atStartOfDay(java.time.ZoneId.systemDefault())
                .toEpochSecond()
        } catch (_: Exception) {
            year.toLong()
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
                    try {
                        java.time.LocalDate.parse(raw).atStartOfDay(java.time.ZoneId.systemDefault()).toEpochSecond()
                    } catch (_: Exception) {
                        0L
                    }
                }
            }
        }
    }
}
