package com.komputerkit.moview.data.api

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String? = null
)

data class PaginatedResponse<T>(
    val success: Boolean,
    val data: List<T>,
    val pagination: Pagination
)

data class Pagination(
    val current_page: Int,
    val last_page: Int,
    val per_page: Int,
    val total: Int
)

data class HomeResponse(
    val popular_this_week: List<MovieCardDto>,
    val new_from_friends: List<FriendReviewDto>
)

data class MovieCardDto(
    val id: Int,
    val title: String,
    val year: Int,
    val duration: String,
    val rating: String,
    val poster_path: String?,
    val backdrop_path: String?,
    val genres: List<String>,
    val average_rating: Float,
    val watched_count: Int
)

data class FriendReviewDto(
    val review_id: Int,
    val user: UserDto,
    val movie: MovieCardDto,
    val rating: Int,
    val created_at: String
)

data class UserDto(
    val id: Int,
    val username: String
)

data class MovieDetailDto(
    val id: Int,
    val title: String,
    val year: Int,
    val duration: String,
    val rating: String,
    val synopsis: String,
    val poster_path: String?,
    val backdrop_path: String?,
    val trailer_url: String?,
    val genres: List<String>,
    val directors: List<DirectorDto>,
    val cast: List<CastDto>,
    val crew: List<CrewJobDto>,
    val statistics: StatisticsDto,
    val streaming_services: List<StreamingServiceDto>,
    val theatrical_services: List<TheatricalServiceDto>,
    val details: MovieDetailsDto
)

data class DirectorDto(
    val id: Int,
    val name: String,
    val photo_url: String?
)

data class CastDto(
    val id: Int,
    val name: String,
    val character: String,
    val photo_url: String?
)

data class CrewJobDto(
    val job: String,
    val people: List<CrewPersonDto>
)

data class CrewPersonDto(
    val id: Int,
    val name: String,
    val photo_url: String?
)

data class StatisticsDto(
    val watched_count: Int,
    val reviews_count: Int,
    val average_rating: Float,
    val rating_distribution: Map<String, Int>
)

data class StreamingServiceDto(
    val id: Int,
    val name: String,
    val logo_url: String?,
    val availability_type: String,
    val release_date: String?
)

data class TheatricalServiceDto(
    val id: Int,
    val name: String,
    val logo_url: String?,
    val release_date: String?
)

data class MovieDetailsDto(
    val original_language: String?,
    val spoken_languages: List<String>,
    val production_countries: List<String>,
    val production_companies: List<String>
)

data class PersonDetailDto(
    val id: Int,
    val name: String,
    val photo_url: String?,
    val bio: String?,
    val date_of_birth: String?,
    val nationality: String?,
    val primary_role: String?,
    val filmography: Map<String, List<FilmographyItemDto>>
)

data class FilmographyItemDto(
    val id: Int,
    val title: String,
    val year: Int,
    val poster_path: String?,
    val character: String?
)
