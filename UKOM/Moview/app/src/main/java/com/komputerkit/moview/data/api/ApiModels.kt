package com.komputerkit.moview.data.api

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String? = null
)

data class SimpleResponse(
    val success: Boolean,
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
    val title: String?,
    val year: Int?,
    val duration: String?,
    val rating: String?,
    val synopsis: String?,
    val poster_path: String?,
    val backdrop_path: String?,
    val trailer_url: String?,
    val genres: List<String>?,
    val directors: List<DirectorDto>?,
    val cast: List<CastDto>?,
    val crew: List<CrewJobDto>?,
    val statistics: StatisticsDto?,
    val streaming_services: List<StreamingServiceDto>?,
    val theatrical_services: List<TheatricalServiceDto>?,
    val details: MovieDetailsDto?
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
    val release_date: String?,
    val is_coming_soon: Boolean = false
)

data class TheatricalServiceDto(
    val id: Int,
    val name: String,
    val logo_url: String?,
    val release_date: String?,
    val is_coming_soon: Boolean = false
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

data class MovieMediaDto(
    val posters: List<MediaItemDto>,
    val backdrops: List<MediaItemDto>
)

data class MediaItemDto(
    val id: Int,
    val file_path: String,
    val is_default: Boolean
)

// Authentication DTOs
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String
)

data class LoginResponse(
    val user: UserInfoDto,
    val token: String
)

data class UserInfoDto(
    val id: Int,
    val username: String,
    val email: String,
    val role: String,
    val joined_at: String
)

// Profile DTOs
data class UserProfileResponse(
    val user: UserBasicInfoDto,
    val profile: ProfileInfoDto,
    val favorites: List<FavoriteMovieDto>,
    val statistics: UserStatisticsDto
)

data class UserBasicInfoDto(
    val id: Int,
    val username: String,
    val email: String,
    val role: String,
    val joined_at: String
)

data class ProfileInfoDto(
    val display_name: String,
    val profile_photo_url: String?,
    val backdrop_url: String?,
    val backdrop_enabled: Boolean = false,
    val bio: String,
    val location: String
)

data class FavoriteMovieDto(
    val id: Int,
    val title: String,
    val year: Int,
    val poster_path: String?,
    val backdrop_path: String?,
    val position: Int
)

data class UserStatisticsDto(
    val films: Int,
    val diary: Int,
    val reviews: Int,
    val watchlist: Int,
    val likes: Int,
    val followers: Int,
    val following: Int,
    val total_ratings: Int? = 0,
    val rating_distribution: Map<String, Int>? = emptyMap()
)

// User Activity DTOs
data class UserFilmDto(
    val id: Int,
    val title: String,
    val year: Int,
    val poster_path: String?,
    val rating: Float? = null,
    val rated_at: String? = null,
    val liked_at: String? = null,
    val added_at: String? = null,
    val is_liked: Boolean? = null,
    val is_in_watchlist: Boolean? = null
)

data class DiaryEntryDto(
    val diary_id: Int,
    val film_id: Int,
    val movie_id: Int,
    val title: String,
    val year: String,
    val poster_path: String?,
    val watched_at: String,
    val note: String?,
    val review_id: Int?,
    val rating: Int?,
    val review_content: String?,
    val is_liked: Boolean,
    val type: String,  // "review" or "log"
    val created_at: String
)

data class WatchCountDto(
    val watch_count: Int
)

data class UserReviewDto(
    val review_id: Int,
    val id: Int,
    val title: String,
    val year: String,  // Changed from Int to String to match backend
    val poster_path: String?,
    val rating: Int?,  // Changed from Float to Int to match backend
    val is_liked: Boolean = false,
    val watched_at: String?,
    val review_title: String?,
    val content: String,
    val is_spoiler: Boolean,
    val created_at: String
)

data class ReviewDetailDto(
    val review_id: Int = 0,
    val diary_id: Int = 0,
    val user_id: Int,
    val movie_id: Int,
    val rating: Int?,
    val snapshot_is_liked: Boolean = false,  // Snapshot for icon next to stars
    val is_liked: Boolean = false,  // Current like status from review_likes
    val review_text: String?,
    val watched_at: String? = null,
    val created_at: String,
    val id: Int,
    val title: String,
    val year: String,
    val poster_path: String?,
    val backdrop_path: String?,
    val username: String,
    val display_name: String?,
    val profile_photo: String?,
    val like_count: Int = 0,
    val comment_count: Int = 0
)

data class ReviewCommentDto(
    val id: Int,
    val review_id: Int,
    val user_id: Int,
    val content: String,
    val created_at: String,
    val username: String,
    val display_name: String?,
    val profile_photo: String?,
    val parent_id: Int? = null,
    val replies: List<ReviewCommentDto>? = null
)

data class UserFollowDto(
    val id: Int,
    val username: String,
    val display_name: String?,
    val profile_photo: String?,
    val bio: String?,
    val followed_at: String
)

// Edit Profile DTOs
data class FavoriteMovieDetailDto(
    val id: Int,
    val title: String,
    val year: Int,
    val poster_path: String?,
    val backdrop_path: String?,
    val position: Int
)

data class ProfilePhotoResponse(
    val profile_photo_url: String
)

data class UpdateProfileRequest(
    val username: String,
    val bio: String,
    val location: String,
    val backdrop_enabled: Boolean
)

data class UpdateBackdropRequest(
    val backdrop_path: String
)

data class UpdateFavoritesRequest(
    val favorites: List<Int?>  // film_ids in order [0-3], null for empty slots
)

data class SaveRatingRequest(
    val rating: Int  // 0-10, 0 = watched without rating
)

data class RatingResponse(
    val rating: Int?,
    val is_watched: Boolean,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class LikeResponse(
    val is_liked: Boolean
)

data class WatchlistResponse(
    val is_in_watchlist: Boolean
)
