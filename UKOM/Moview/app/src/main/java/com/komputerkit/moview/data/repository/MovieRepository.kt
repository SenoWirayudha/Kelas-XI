package com.komputerkit.moview.data.repository

import android.util.Log
import com.komputerkit.moview.data.api.MovieCardDto
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.ReviewCommentDto
import com.komputerkit.moview.data.api.SearchResponse
import com.komputerkit.moview.data.api.UserProfileResponse
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.User
import com.komputerkit.moview.data.model.Notification
import com.komputerkit.moview.data.model.NotificationType
import com.komputerkit.moview.data.model.NotificationSection
import com.komputerkit.moview.util.TmdbImageUrl
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody

class MovieRepository {
    
    private val apiService = RetrofitClient.movieApiService
    
    // Konversi dari DTO ke Model
    private fun MovieCardDto.toMovie(): Movie {
        val posterUrl = when {
            this.poster_path.isNullOrBlank() -> ""
            this.poster_path.startsWith("http") -> this.poster_path.replace("127.0.0.1", "10.0.2.2")
            else -> "http://10.0.2.2:8000/storage/${this.poster_path}"
        }
        
        return Movie(
            id = this.id,
            title = this.title,
            posterUrl = posterUrl,
            averageRating = this.average_rating,
            genre = this.genres.joinToString(", "),
            releaseYear = this.year,
            description = "",
            hasReview = false,
            reviewId = 0,
            userRating = 0f
        )
    }
    
    // Ambil data dari API
    suspend fun getPopularMoviesThisWeek(): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getHome()
            if (response.success && response.data != null) {
                response.data.popular_this_week.map { it.toMovie() }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getFriendActivities(): List<FriendActivity> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getHome()
            if (response.success && response.data != null) {
                response.data.new_from_friends.map { review ->
                    FriendActivity(
                        id = review.review_id,
                        user = User(
                            id = review.user.id,
                            username = review.user.username,
                            profilePhotoUrl = "",
                            email = "",
                            bio = ""
                        ),
                        movie = review.movie.toMovie(),
                        rating = review.rating.toFloat(),
                        likeCount = 0,
                        isRewatch = false,
                        hasReview = true,
                        reviewText = "",
                        timestamp = System.currentTimeMillis()
                    )
                }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun searchMovies(query: String): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.searchMovies(query)
            if (response.success && response.data != null) {
                response.data.map { it.toMovie() }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun search(query: String, type: String): SearchResponse? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.search(query, type)
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun getUserProfile(userId: Int): UserProfileResponse? = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "=== Calling API getUserProfile for userId: $userId ===")
            val response = apiService.getUserProfile(userId)
            android.util.Log.d("MovieRepository", "API Response - success: ${response.success}")
            android.util.Log.d("MovieRepository", "API Response - data: ${response.data}")
            
            if (response.success && response.data != null) {
                android.util.Log.d("MovieRepository", "Returning profile data")
                response.data
            } else {
                android.util.Log.e("MovieRepository", "Response not successful or data is null")
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "!!! EXCEPTION in getUserProfile !!!", e)
            android.util.Log.e("MovieRepository", "Error: ${e.message}")
            e.printStackTrace()
            null
        }
    }
    
    suspend fun updateUserProfile(userId: Int, request: com.komputerkit.moview.data.api.UpdateProfileRequest): com.komputerkit.moview.data.api.ApiResponse<com.komputerkit.moview.data.api.ProfilePhotoResponse>? = withContext(Dispatchers.IO) {
        try {
            apiService.updateUserProfile(userId, request)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun updateUserFavorites(userId: Int, request: com.komputerkit.moview.data.api.UpdateFavoritesRequest): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updateUserFavorites(userId, request)
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    suspend fun uploadProfilePhoto(userId: Int, imageUri: android.net.Uri, context: android.content.Context): String? = withContext(Dispatchers.IO) {
        try {
            val file = java.io.File(context.cacheDir, "profile_photo_${System.currentTimeMillis()}.jpg")
            context.contentResolver.openInputStream(imageUri)?.use { input ->
                file.outputStream().use { output -> 
                    input.copyTo(output) 
                }
            }
            
            val requestBody = file.asRequestBody("image/*".toMediaTypeOrNull())
            val part = okhttp3.MultipartBody.Part.createFormData("photo", file.name, requestBody)
            
            val response = apiService.uploadProfilePhoto(userId, part)
            file.delete() // Clean up temp file
            
            if (response.success && response.data != null) {
                response.data.profile_photo_url
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun deleteProfilePhoto(userId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteProfilePhoto(userId)
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    suspend fun updateUserBackdrop(userId: Int, backdropPath: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = com.komputerkit.moview.data.api.UpdateBackdropRequest(backdrop_path = backdropPath)
            val response = apiService.updateUserBackdrop(userId, request)
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    suspend fun getUserFilms(userId: Int): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserFilms(userId)
            if (response.success && response.data != null) {
                // Get all user reviews once for efficiency
                val userReviews = getUserReviews(userId)
                
                response.data.map { filmDto ->
                    Log.d("MovieRepository", "Film: ${filmDto.title}, is_liked=${filmDto.is_liked}, rating=${filmDto.rating}")
                    
                    // Check if user has review for this film
                    val review = userReviews.find { it.id == filmDto.id }
                    
                    Movie(
                        id = filmDto.id,
                        title = filmDto.title,
                        releaseYear = filmDto.year,
                        posterUrl = filmDto.poster_path ?: "",
                        userRating = filmDto.rating ?: 0f,
                        averageRating = 0f,
                        genre = "",
                        description = "",
                        hasReview = review != null,
                        reviewId = review?.review_id ?: 0,
                        isLiked = filmDto.is_liked ?: false,
                        isInWatchlist = filmDto.is_in_watchlist ?: false
                    )
                }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getUserDiary(userId: Int): List<com.komputerkit.moview.data.model.DiaryEntry> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserDiary(userId)
            if (response.success && response.data != null) {
                response.data.map { dto ->
                    // Build full URL for poster
                    val posterUrl = when {
                        dto.poster_path.isNullOrBlank() -> ""
                        dto.poster_path.startsWith("http") -> dto.poster_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${dto.poster_path}"
                    }
                    
                    val movie = Movie(
                        id = dto.movie_id,
                        title = dto.title,
                        releaseYear = dto.year.toIntOrNull() ?: 0,
                        posterUrl = posterUrl,
                        userRating = dto.rating?.toFloat() ?: 0f,
                        averageRating = 0f,
                        genre = "",
                        description = dto.note ?: "",
                        hasReview = dto.type == "review",
                        reviewId = dto.review_id ?: 0
                    )
                    
                    com.komputerkit.moview.data.model.DiaryEntry(
                        id = dto.diary_id,
                        movie = movie,
                        watchedDate = dto.watched_at,
                        dateLabel = formatDiaryDate(dto.watched_at),
                        monthYear = formatMonthYear(dto.watched_at),
                        rating = dto.rating ?: 0,
                        hasReview = dto.type == "review",
                        isLiked = dto.is_liked,
                        isRewatched = dto.is_rewatched,
                        reviewId = dto.review_id
                    )
                }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error getting diary: ${e.message}", e)
            emptyList()
        }
    }
    
    suspend fun getWatchCount(userId: Int, movieId: Int): Int = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getWatchCount(userId, movieId)
            if (response.success && response.data != null) {
                response.data.watch_count
            } else {
                0
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error getting watch count: ${e.message}", e)
            0
        }
    }
    
    private fun formatDiaryDate(dateString: String): String {
        return try {
            val parts = dateString.split("-")
            if (parts.size == 3) {
                val day = parts[2]
                "${day.toIntOrNull() ?: 1}"
            } else {
                dateString
            }
        } catch (e: Exception) {
            dateString
        }
    }
    
    private fun formatMonthYear(dateString: String): String {
        return try {
            val parts = dateString.split("-")
            if (parts.size == 3) {
                val year = parts[0]
                val month = parts[1]
                val monthName = when (month) {
                    "01" -> "Januari"
                    "02" -> "Februari"
                    "03" -> "Maret"
                    "04" -> "April"
                    "05" -> "Mei"
                    "06" -> "Juni"
                    "07" -> "Juli"
                    "08" -> "Agustus"
                    "09" -> "September"
                    "10" -> "Oktober"
                    "11" -> "November"
                    "12" -> "Desember"
                    else -> month
                }
                "$monthName $year"
            } else {
                dateString
            }
        } catch (e: Exception) {
            dateString
        }
    }
    
    suspend fun getUserWatchlist(userId: Int): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserWatchlist(userId)
            if (response.success && response.data != null) {
                response.data.map { filmDto ->
                    Movie(
                        id = filmDto.id,
                        title = filmDto.title,
                        releaseYear = filmDto.year,
                        posterUrl = filmDto.poster_path ?: "",
                        averageRating = 0f,
                        genre = "",
                        description = "",
                        hasReview = false,
                        reviewId = 0,
                        userRating = 0f
                    )
                }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getUserLikes(userId: Int): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserLikes(userId)
            if (response.success && response.data != null) {
                // Get all user reviews once for efficiency
                val userReviews = getUserReviews(userId)
                
                response.data.map { filmDto ->
                    // Format poster URL
                    val posterUrl = when {
                        filmDto.poster_path.isNullOrBlank() -> ""
                        filmDto.poster_path.startsWith("http") -> filmDto.poster_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${filmDto.poster_path}"
                    }
                    
                    // Check if user has review for this film
                    val review = userReviews.find { it.id == filmDto.id }
                    
                    Movie(
                        id = filmDto.id,
                        title = filmDto.title,
                        releaseYear = filmDto.year,
                        posterUrl = posterUrl,
                        averageRating = 0f,
                        genre = "",
                        description = "",
                        hasReview = review != null,
                        reviewId = review?.review_id ?: 0,
                        userRating = filmDto.rating ?: 0f,  // Now uses user's rating from ratings table
                        isLiked = true  // All films in likes are liked
                    )
                }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getUserReviews(userId: Int): List<com.komputerkit.moview.data.api.UserReviewDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserReviews(userId)
            if (response.success && response.data != null) {
                response.data
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getUserReviewForMovie(userId: Int, movieId: Int): com.komputerkit.moview.data.api.UserReviewDto? = withContext(Dispatchers.IO) {
        try {
            val reviews = getUserReviews(userId)
            reviews.find { it.id == movieId }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun getReviewDetail(userId: Int, reviewId: Int): com.komputerkit.moview.data.api.ReviewDetailDto? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getReviewDetail(userId, reviewId)
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error getting review detail: ${e.message}", e)
            e.printStackTrace()
            null
        }
    }
    
    suspend fun getDiaryDetail(userId: Int, diaryId: Int): com.komputerkit.moview.data.api.ReviewDetailDto? = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "getDiaryDetail: userId=$userId, diaryId=$diaryId")
            val response = apiService.getDiaryDetail(userId, diaryId)
            android.util.Log.d("MovieRepository", "getDiaryDetail response: success=${response.success}, data=${response.data}")
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error getting diary detail: ${e.message}", e)
            e.printStackTrace()
            null
        }
    }
    
    suspend fun deleteReview(userId: Int, reviewId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteReview(userId, reviewId)
            response.success
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error deleting review: ${e.message}", e)
            false
        }
    }
    
    suspend fun deleteDiary(userId: Int, diaryId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteDiary(userId, diaryId)
            response.success
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error deleting diary: ${e.message}", e)
            false
        }
    }
    
    suspend fun getReviewComments(reviewId: Int): List<com.komputerkit.moview.data.model.Comment> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getReviewComments(reviewId)
            if (response.success && response.data != null) {
                response.data.map { dto -> mapDtoToComment(dto) }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error getting comments: ${e.message}", e)
            emptyList()
        }
    }
    
    private fun mapDtoToComment(dto: ReviewCommentDto): com.komputerkit.moview.data.model.Comment {
        // Build profile photo URL
        val profilePhotoUrl = if (!dto.profile_photo.isNullOrBlank()) {
            if (dto.profile_photo.startsWith("http")) {
                dto.profile_photo.replace("127.0.0.1", "10.0.2.2")
            } else {
                "http://10.0.2.2:8000/storage/${dto.profile_photo}"
            }
        } else {
            ""
        }
        
        // Recursively map replies
        val replies = dto.replies?.map { replyDto -> mapDtoToComment(replyDto) }?.toMutableList() ?: mutableListOf()
        
        return com.komputerkit.moview.data.model.Comment(
            id = dto.id,
            reviewId = dto.review_id,
            userId = dto.user_id,
            username = dto.display_name ?: dto.username,
            userAvatar = profilePhotoUrl,
            commentText = dto.content,
            timeAgo = formatCommentTime(dto.created_at),
            likeCount = 0,  // TODO: Implement comment likes
            parentId = dto.parent_id,
            replies = replies
        )
    }
    
    suspend fun addReviewComment(userId: Int, reviewId: Int, commentText: String, parentId: Int? = null): com.komputerkit.moview.data.model.Comment? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.addReviewComment(userId, reviewId, commentText, parentId)
            if (response.success && response.data != null) {
                val dto = response.data
                
                // Build profile photo URL
                val profilePhotoUrl = if (!dto.profile_photo.isNullOrBlank()) {
                    if (dto.profile_photo.startsWith("http")) {
                        dto.profile_photo.replace("127.0.0.1", "10.0.2.2")
                    } else {
                        "http://10.0.2.2:8000/storage/${dto.profile_photo}"
                    }
                } else {
                    ""
                }
                
                com.komputerkit.moview.data.model.Comment(
                    id = dto.id,
                    reviewId = dto.review_id,
                    userId = dto.user_id,
                    username = dto.display_name ?: dto.username,
                    userAvatar = profilePhotoUrl,
                    commentText = dto.content,
                    timeAgo = "Just now",
                    likeCount = 0,
                    parentId = dto.parent_id
                )
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error adding comment: ${e.message}", e)
            null
        }
    }
    
    private fun formatCommentTime(dateString: String): String {
        return try {
            val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
            val date = inputFormat.parse(dateString)
            if (date != null) {
                val now = java.util.Date()
                val diff = now.time - date.time
                val seconds = diff / 1000
                val minutes = seconds / 60
                val hours = minutes / 60
                val days = hours / 24
                
                when {
                    seconds < 60 -> "Just now"
                    minutes < 60 -> "${minutes}m ago"
                    hours < 24 -> "${hours}h ago"
                    days < 7 -> "${days}d ago"
                    else -> {
                        val outputFormat = java.text.SimpleDateFormat("MMM d", java.util.Locale.getDefault())
                        outputFormat.format(date)
                    }
                }
            } else {
                "Recently"
            }
        } catch (e: Exception) {
            "Recently"
        }
    }
    
    suspend fun updateReview(
        userId: Int,
        reviewId: Int,
        reviewText: String,
        rating: Int,
        containsSpoilers: Boolean,
        watchedAt: String? = null
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "updateReview: userId=$userId, reviewId=$reviewId, rating=$rating, watchedAt=$watchedAt")
            val response = apiService.updateReview(userId, reviewId, reviewText, rating, if (containsSpoilers) 1 else 0, watchedAt)
            android.util.Log.d("MovieRepository", "updateReview response: success=${response.success}")
            response.success
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error updating review: ${e.message}", e)
            e.printStackTrace()
            false
        }
    }
    
    suspend fun getUserFollowers(userId: Int): List<com.komputerkit.moview.data.api.UserFollowDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserFollowers(userId)
            if (response.success && response.data != null) {
                response.data
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getUserFollowing(userId: Int): List<com.komputerkit.moview.data.api.UserFollowDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUserFollowing(userId)
            if (response.success && response.data != null) {
                response.data
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun followUser(userId: Int, targetUserId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "Following user: currentUser=$userId, target=$targetUserId")
            val response = apiService.followUser(userId, targetUserId)
            android.util.Log.d("MovieRepository", "Follow response: success=${response.success}, message=${response.message}")
            response.success
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error following user", e)
            e.printStackTrace()
            false
        }
    }
    
    suspend fun unfollowUser(userId: Int, targetUserId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "Unfollowing user: currentUser=$userId, target=$targetUserId")
            val response = apiService.unfollowUser(userId, targetUserId)
            android.util.Log.d("MovieRepository", "Unfollow response: success=${response.success}, message=${response.message}")
            response.success
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error unfollowing user", e)
            e.printStackTrace()
            false
        }
    }
    
    suspend fun isFollowing(userId: Int, targetUserId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "Checking follow status: currentUser=$userId, target=$targetUserId")
            val response = apiService.isFollowing(userId, targetUserId)
            val isFollowing = response.success && response.data?.isFollowing == true
            android.util.Log.d("MovieRepository", "Follow status: isFollowing=$isFollowing")
            isFollowing
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "Error checking follow status", e)
            e.printStackTrace()
            false
        }
    }

    suspend fun getMovieDetail(movieId: Int): Movie? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMovieDetail(movieId)
            if (response.success && response.data != null) {
                val movie = response.data
                
                // Combine directors into crew list as "Director" job
                val directorsAsCrew = if (movie.directors?.isNotEmpty() == true) {
                    listOf(
                        com.komputerkit.moview.data.api.CrewJobDto(
                            job = "Director",
                            people = movie.directors.map { director ->
                                com.komputerkit.moview.data.api.CrewPersonDto(
                                    id = director.id,
                                    name = director.name,
                                    photo_url = director.photo_url
                                )
                            }
                        )
                    )
                } else {
                    emptyList()
                }
                
                // Merge directors at the beginning of crew list
                val fullCrew = directorsAsCrew + (movie.crew ?: emptyList())
                
                Movie(
                    id = movie.id,
                    title = movie.title,
                    posterUrl = movie.poster_path,
                    backdropUrl = movie.backdrop_path,
                    trailerUrl = movie.trailer_url,
                    averageRating = movie.statistics?.average_rating,
                    genre = movie.genres?.joinToString(", "),
                    releaseYear = movie.year,
                    description = movie.synopsis,
                    director = movie.directors?.firstOrNull()?.name,
                    directorId = movie.directors?.firstOrNull()?.id,
                    duration = movie.duration,
                    pgRating = movie.rating,
                    watchedCount = movie.statistics?.watched_count?.toString(),
                    reviewCount = movie.statistics?.reviews_count?.toString(),
                    rating5 = movie.statistics?.rating_distribution?.get("5") ?: 0,
                    rating4 = movie.statistics?.rating_distribution?.get("4") ?: 0,
                    rating3 = movie.statistics?.rating_distribution?.get("3") ?: 0,
                    rating2 = movie.statistics?.rating_distribution?.get("2") ?: 0,
                    rating1 = movie.statistics?.rating_distribution?.get("1") ?: 0,
                    cast = movie.cast?.map { cast ->
                        com.komputerkit.moview.data.model.CastMember(
                            id = cast.id,
                            name = cast.name,
                            character = cast.character,
                            photoUrl = cast.photo_url ?: ""
                        )
                    } ?: emptyList(),
                    hasReview = false,
                    reviewId = 0,
                    userRating = 0f,
                    streamingServices = movie.streaming_services ?: emptyList(),
                    theatricalServices = movie.theatrical_services ?: emptyList(),
                    crew = fullCrew,
                    originalLanguage = movie.details?.original_language,
                    spokenLanguages = movie.details?.spoken_languages ?: emptyList(),
                    productionCountries = movie.details?.production_countries ?: emptyList(),
                    productionCompanies = movie.details?.production_companies ?: emptyList()
                )
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun getPersonDetail(personId: Int): com.komputerkit.moview.data.api.PersonDetailDto? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPersonDetail(personId)
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun getFilmsByCategory(categoryType: String, categoryValue: String): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getFilmsByCategory(categoryType, categoryValue)
            if (response.success && response.data != null) {
                response.data.map { it.toMovie() }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getMovieMedia(movieId: Int): com.komputerkit.moview.data.api.MovieMediaDto? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMovieMedia(movieId)
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    // FALLBACK: Data dummy untuk development (akan dihapus nanti)
    fun getPopularMoviesThisWeekDummy(): List<Movie> {
        return listOf(
            Movie(
                id = 1,
                title = "The Shawshank Redemption",
                posterUrl = TmdbImageUrl.getPosterUrl("/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg") ?: "",
                averageRating = 4.8f,
                genre = "Drama",
                releaseYear = 1994,
                description = "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
                hasReview = true,
                reviewId = 1,
                userRating = 5f
            ),
            Movie(
                id = 2,
                title = "The Godfather",
                posterUrl = TmdbImageUrl.getPosterUrl("/3bhkrj58Vtu7enYsRolD1fZdja1.jpg") ?: "",
                averageRating = 4.7f,
                genre = "Crime, Drama",
                releaseYear = 1972,
                description = "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
                hasReview = false,
                reviewId = 0,
                userRating = 4.5f
            ),
            Movie(
                id = 3,
                title = "The Dark Knight",
                posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT) ?: "",
                averageRating = 4.6f,
                genre = "Action, Crime",
                releaseYear = 2008,
                description = "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
                hasReview = true,
                reviewId = 3,
                userRating = 4f
            ),
            Movie(
                id = 4,
                title = "Pulp Fiction",
                posterUrl = TmdbImageUrl.getPosterUrl("/dRaGv7snvPZH0QXKNGSuPOK0Nzq.jpg") ?: "",
                averageRating = 4.5f,
                genre = "Crime, Drama",
                releaseYear = 1994,
                description = "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
                hasReview = false,
                reviewId = 0,
                userRating = 3.5f
            ),
            Movie(
                id = 5,
                title = "Forrest Gump",
                posterUrl = TmdbImageUrl.getPosterUrl("/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg") ?: "",
                averageRating = 4.4f,
                genre = "Drama, Romance",
                releaseYear = 1994,
                description = "The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man.",
                hasReview = true,
                reviewId = 2,
                userRating = 5f
            ),
            Movie(
                id = 6,
                title = "Inception",
                posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION) ?: "",
                averageRating = 4.5f,
                genre = "Action, Sci-Fi",
                releaseYear = 2010,
                description = "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
                hasReview = false,
                reviewId = 0,
                userRating = 3f
            ),
            Movie(
                id = 7,
                title = "The Matrix",
                posterUrl = TmdbImageUrl.getPosterUrl("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg") ?: "",
                averageRating = 4.4f,
                genre = "Action, Sci-Fi",
                releaseYear = 1999,
                description = "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
                hasReview = false,
                reviewId = 0,
                userRating = 4.5f
            ),
            Movie(
                id = 8,
                title = "Interstellar",
                posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR) ?: "",
                averageRating = 4.6f,
                genre = "Adventure, Drama, Sci-Fi",
                releaseYear = 2014,
                description = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                hasReview = true,
                reviewId = 4,
                userRating = 5f
            )
        )
    }
    
    fun getFriendActivitiesDummy(): List<FriendActivity> {
        val users = listOf(
            User(
                id = 1,
                username = "john_cinema",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                email = "john@example.com",
                bio = "Movie enthusiast"
            ),
            User(
                id = 2,
                username = "sarah_films",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                email = "sarah@example.com",
                bio = "Love classic movies"
            ),
            User(
                id = 3,
                username = "mike_reviews",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                email = "mike@example.com",
                bio = "Professional movie critic"
            ),
            User(
                id = 4,
                username = "emma_movie",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                email = "emma@example.com",
                bio = "Sci-fi fan"
            ),
            User(
                id = 5,
                username = "david_watch",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                email = "david@example.com",
                bio = "Weekend movie watcher"
            )
        )
        
        val movies = getPopularMoviesThisWeekDummy()
        
        return listOf(
            FriendActivity(
                id = 1,
                user = users[0],
                movie = movies[0],
                rating = 5.0f,
                likeCount = 24,
                isRewatch = false,
                hasReview = true,
                reviewText = "Absolutely masterpiece! The story keeps you engaged from start to finish.",
                timestamp = System.currentTimeMillis() - 3600000 // 1 hour ago
            ),
            FriendActivity(
                id = 2,
                user = users[1],
                movie = movies[2],
                rating = 4.5f,
                likeCount = 18,
                isRewatch = true,
                hasReview = false,
                timestamp = System.currentTimeMillis() - 7200000 // 2 hours ago
            ),
            FriendActivity(
                id = 3,
                user = users[2],
                movie = movies[5],
                rating = 4.8f,
                likeCount = 32,
                isRewatch = false,
                hasReview = true,
                reviewText = "Mind-bending and visually stunning. Nolan at his best!",
                timestamp = System.currentTimeMillis() - 10800000 // 3 hours ago
            ),
            FriendActivity(
                id = 4,
                user = users[3],
                movie = movies[7],
                rating = 5.0f,
                likeCount = 45,
                isRewatch = true,
                hasReview = true,
                reviewText = "Watched it for the 3rd time and still amazed by the emotional depth and scientific accuracy.",
                timestamp = System.currentTimeMillis() - 14400000 // 4 hours ago
            ),
            FriendActivity(
                id = 5,
                user = users[4],
                movie = movies[4],
                rating = 4.0f,
                likeCount = 12,
                isRewatch = false,
                hasReview = false,
                timestamp = System.currentTimeMillis() - 18000000 // 5 hours ago
            ),
            FriendActivity(
                id = 6,
                user = users[0],
                movie = movies[3],
                rating = 4.7f,
                likeCount = 28,
                isRewatch = true,
                hasReview = true,
                reviewText = "Tarantino's storytelling is unmatched. Every scene is iconic.",
                timestamp = System.currentTimeMillis() - 21600000 // 6 hours ago
            )
        )
    }
    
    fun getNotifications(): List<Notification> {
        return listOf(
            // Today
            Notification(
                id = 1,
                userId = 1,
                userName = "john_cinema",
                userAvatar = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                message = "john_cinema liked your review of Inception",
                time = "2 hours ago",
                moviePoster = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION) ?: "",
                isRead = false,
                type = NotificationType.LIKE,
                section = NotificationSection.TODAY
            ),
            Notification(
                id = 2,
                userId = 2,
                userName = "sarah_films",
                userAvatar = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                message = "sarah_films commented on your review: \"Great analysis!\"",
                time = "4 hours ago",
                moviePoster = TmdbImageUrl.getPosterUrl("/3bhkrj58Vtu7enYsRolD1fZdja1.jpg") ?: "",
                isRead = false,
                type = NotificationType.COMMENT,
                section = NotificationSection.TODAY
            ),
            Notification(
                id = 3,
                userId = 3,
                userName = "mike_reviews",
                userAvatar = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                message = "mike_reviews started following you",
                time = "6 hours ago",
                isRead = true,
                type = NotificationType.FOLLOW,
                section = NotificationSection.TODAY
            ),
            // Yesterday
            Notification(
                id = 4,
                userId = 4,
                userName = "emma_movie",
                userAvatar = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                message = "emma_movie liked your review of The Matrix",
                time = "Yesterday",
                moviePoster = TmdbImageUrl.getPosterUrl("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg") ?: "",
                isRead = true,
                type = NotificationType.LIKE,
                section = NotificationSection.YESTERDAY
            ),
            Notification(
                id = 5,
                userId = 5,
                userName = "david_watch",
                userAvatar = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                message = "david_watch commented on your review: \"I completely agree!\"",
                time = "Yesterday",
                moviePoster = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT) ?: "",
                isRead = true,
                type = NotificationType.COMMENT,
                section = NotificationSection.YESTERDAY
            ),
            // Last Week
            Notification(
                id = 6,
                userId = 1,
                userName = "john_cinema",
                userAvatar = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                message = "john_cinema liked your review of Interstellar",
                time = "5 days ago",
                moviePoster = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR) ?: "",
                isRead = true,
                type = NotificationType.LIKE,
                section = NotificationSection.LAST_WEEK
            ),
            Notification(
                id = 7,
                userId = 2,
                userName = "sarah_films",
                userAvatar = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                message = "sarah_films started following you",
                time = "6 days ago",
                isRead = true,
                type = NotificationType.FOLLOW,
                section = NotificationSection.LAST_WEEK
            )
        )
    }
    
    fun getMovies(): List<Movie> {
        return getPopularMoviesThisWeekDummy()
    }
    
    fun getDiaryEntries(): List<com.komputerkit.moview.data.model.DiaryEntry> {
        val movies = getPopularMoviesThisWeekDummy()
        return listOf(
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 1,
                movie = movies[0],
                watchedDate = "2023-10-14",
                dateLabel = "14 Oct",
                monthYear = "OCTOBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 2,
                movie = movies[1],
                watchedDate = "2023-10-12",
                dateLabel = "12 Oct",
                monthYear = "OCTOBER 2023",
                rating = 4,
                hasReview = false,
                isLiked = false
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 3,
                movie = movies[2],
                watchedDate = "2023-10-08",
                dateLabel = "08 Oct",
                monthYear = "OCTOBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 4,
                movie = movies[3],
                watchedDate = "2023-10-05",
                dateLabel = "05 Oct",
                monthYear = "OCTOBER 2023",
                rating = 4,
                hasReview = false,
                isLiked = false
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 5,
                movie = movies[4],
                watchedDate = "2023-09-28",
                dateLabel = "28 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 6,
                movie = movies[0],
                watchedDate = "2023-09-22",
                dateLabel = "22 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 4,
                hasReview = false,
                isLiked = false
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 7,
                movie = movies[1],
                watchedDate = "2023-09-15",
                dateLabel = "15 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 8,
                movie = movies[2],
                watchedDate = "2023-09-10",
                dateLabel = "10 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 3,
                hasReview = false,
                isLiked = false
            )
        )
    }
    
    fun getReviews(): List<com.komputerkit.moview.data.model.Review> {
        val movies = getPopularMoviesThisWeekDummy()
        return listOf(
            com.komputerkit.moview.data.model.Review(
                id = 1,
                movie = movies[0],
                rating = 9.0f,
                reviewText = "A visual masterpiece that surpasses the first part in every way. The scale and ambition of this film is breathtaking, with stunning cinematography and powerful performances.",
                reviewDate = "2024-03-15",
                dateLabel = "Mar 15, 2024"
            ),
            com.komputerkit.moview.data.model.Review(
                id = 2,
                movie = movies[1],
                rating = 10.0f,
                reviewText = "Absolutely chaotic and beautiful. I cried laughing and then just cried. A mind-bending journey through the multiverse that somehow feels deeply personal and universally relatable.",
                reviewDate = "2023-01-10",
                dateLabel = "Jan 10, 2023"
            ),
            com.komputerkit.moview.data.model.Review(
                id = 3,
                movie = movies[2],
                rating = 8.5f,
                reviewText = "Finally a detective story. Pattinson is a great dark knight, and the atmosphere is perfect. The noir aesthetic combined with modern sensibilities creates something truly unique.",
                reviewDate = "2022-04-05",
                dateLabel = "Apr 05, 2022"
            ),
            com.komputerkit.moview.data.model.Review(
                id = 4,
                movie = movies[3],
                rating = 9.5f,
                reviewText = "Nolan does it again. The tension during the Trinity test sequence was palpable. A masterful blend of historical drama and psychological thriller that left me speechless.",
                reviewDate = "2023-07-22",
                dateLabel = "Jul 22, 2023"
            )
        )
    }
    
    fun getWatchlistItems(): List<com.komputerkit.moview.data.model.WatchlistItem> {
        val movies = getPopularMoviesThisWeekDummy()
        return listOf(
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 1,
                movie = movies[0].copy(
                    id = 10,
                    title = "The Dark Horizon",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_BATMAN_BEGINS) ?: "",
                    releaseYear = 2024,
                    averageRating = 8.4f
                ),
                addedDate = "2024-01-05",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 2,
                movie = movies[1].copy(
                    id = 11,
                    title = "Cyber City 2099",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_TENET) ?: "",
                    releaseYear = 2023,
                    averageRating = 0f
                ),
                addedDate = "2024-01-04",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 3,
                movie = movies[2].copy(
                    id = 12,
                    title = "Prism",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNE) ?: "",
                    releaseYear = 2022,
                    averageRating = 9.1f
                ),
                addedDate = "2024-01-03",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 4,
                movie = movies[3].copy(
                    id = 13,
                    title = "The Silent Woods",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNKIRK) ?: "",
                    releaseYear = 2024,
                    averageRating = 0f
                ),
                addedDate = "2024-01-02",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 5,
                movie = movies[4].copy(
                    id = 14,
                    title = "Echoes of Time",
                    posterUrl = TmdbImageUrl.getPosterUrl("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg") ?: "",
                    releaseYear = 1984,
                    averageRating = 0f
                ),
                addedDate = "2023-12-28",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 6,
                movie = movies[0].copy(
                    id = 15,
                    title = "Autumn Leaves",
                    posterUrl = TmdbImageUrl.getPosterUrl("/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg") ?: "",
                    releaseYear = 2021,
                    averageRating = 7.8f
                ),
                addedDate = "2023-12-25",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 7,
                movie = movies[1].copy(
                    id = 16,
                    title = "System Core",
                    posterUrl = TmdbImageUrl.getPosterUrl("/dRaGv7snvPZH0QXKNGSuPOK0Nzq.jpg") ?: "",
                    releaseYear = 2026,
                    averageRating = 0f
                ),
                addedDate = "2023-12-20",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 8,
                movie = movies[2].copy(
                    id = 17,
                    title = "Deep Dive",
                    posterUrl = TmdbImageUrl.getPosterUrl("/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg") ?: "",
                    releaseYear = 2023,
                    averageRating = 0f
                ),
                addedDate = "2023-12-15",
                isWatched = false
            )
        )
    }
    
    fun getFollowers(): List<com.komputerkit.moview.data.model.UserProfile> {
        return listOf(
            com.komputerkit.moview.data.model.UserProfile(
                id = 1,
                username = "MovieBuff99",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 2,
                username = "SarahFilms",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                bio = "Reviewer at Letterboxd"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 3,
                username = "ActionHero",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 4,
                username = "Cinephile2024",
                avatarUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 5,
                username = "DirectorCut",
                avatarUrl = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                bio = "24 Mutual friends"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 6,
                username = "NoirFanatic",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 7,
                username = "SciFiGuru",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                bio = "Sci-fi enthusiast"
            )
        )
    }
    
    fun getFollowing(): List<com.komputerkit.moview.data.model.UserProfile> {
        return listOf(
            com.komputerkit.moview.data.model.UserProfile(
                id = 11,
                username = "Sarah Connor",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                bio = "@sarahc • 42 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 12,
                username = "Marty McFly",
                avatarUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                bio = "@timetraveler • 128 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 13,
                username = "Ellen Ripley",
                avatarUrl = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                bio = "@nostromo_offi... • 89 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 14,
                username = "Thomas Anderson",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                bio = "@neo_one • 15 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 15,
                username = "Furiosa",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                bio = "@imperator • 33 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 16,
                username = "Tony Stark",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                bio = "@ironman • 1,024 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 17,
                username = "Rick Deckard",
                avatarUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                bio = "@bladerunner • 0 reviews"
            )
        )
    }
    
    // Rating functions
    suspend fun saveRating(userId: Int, movieId: Int, rating: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = com.komputerkit.moview.data.api.SaveRatingRequest(rating = rating)
            val response = apiService.saveRating(userId, movieId, request)
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    suspend fun getRating(userId: Int, movieId: Int): com.komputerkit.moview.data.api.RatingResponse? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getRating(userId, movieId)
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun deleteRating(userId: Int, movieId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteRating(userId, movieId)
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    suspend fun toggleLike(userId: Int, movieId: Int): Boolean? = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "toggleLike: userId=$userId, movieId=$movieId")
            val response = apiService.toggleLike(userId, movieId)
            android.util.Log.d("MovieRepository", "toggleLike response: success=${response.success}, data=${response.data}")
            if (response.success && response.data != null) {
                android.util.Log.d("MovieRepository", "toggleLike result: is_liked=${response.data.is_liked}")
                response.data.is_liked
            } else {
                android.util.Log.e("MovieRepository", "toggleLike failed: success=${response.success}")
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "toggleLike exception: ${e.message}", e)
            e.printStackTrace()
            null
        }
    }
    
    suspend fun checkLike(userId: Int, movieId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "checkLike: userId=$userId, movieId=$movieId")
            val response = apiService.checkLike(userId, movieId)
            android.util.Log.d("MovieRepository", "checkLike response: success=${response.success}, is_liked=${response.data?.is_liked}")
            response.success && response.data?.is_liked == true
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "checkLike exception: ${e.message}", e)
            e.printStackTrace()
            false
        }
    }
    
    suspend fun toggleWatchlist(userId: Int, movieId: Int): Boolean? = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "toggleWatchlist: userId=$userId, movieId=$movieId")
            val response = apiService.toggleWatchlist(userId, movieId)
            android.util.Log.d("MovieRepository", "toggleWatchlist response: success=${response.success}, data=${response.data}")
            if (response.success && response.data != null) {
                android.util.Log.d("MovieRepository", "toggleWatchlist result: is_in_watchlist=${response.data.is_in_watchlist}")
                response.data.is_in_watchlist
            } else {
                android.util.Log.e("MovieRepository", "toggleWatchlist failed: success=${response.success}")
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "toggleWatchlist exception: ${e.message}", e)
            e.printStackTrace()
            null
        }
    }
    
    suspend fun checkWatchlist(userId: Int, movieId: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "checkWatchlist: userId=$userId, movieId=$movieId")
            val response = apiService.checkWatchlist(userId, movieId)
            android.util.Log.d("MovieRepository", "checkWatchlist response: success=${response.success}, is_in_watchlist=${response.data?.is_in_watchlist}")
            response.success && response.data?.is_in_watchlist == true
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "checkWatchlist exception: ${e.message}", e)
            e.printStackTrace()
            false
        }
    }
    
    suspend fun saveReview(
        userId: Int,
        filmId: Int,
        reviewText: String,
        rating: Int,
        containsSpoilers: Boolean,
        watchedAt: String? = null,
        isRewatch: Boolean = false
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d("MovieRepository", "saveReview: userId=$userId, filmId=$filmId, rating=$rating, spoilers=$containsSpoilers, watchedAt=$watchedAt, isRewatch=$isRewatch")
            val response = apiService.saveReview(userId, filmId, reviewText, rating, if (containsSpoilers) 1 else 0, watchedAt, if (isRewatch) 1 else 0)
            android.util.Log.d("MovieRepository", "saveReview response: success=${response.success}")
            response.success
        } catch (e: Exception) {
            android.util.Log.e("MovieRepository", "saveReview exception: ${e.message}", e)
            e.printStackTrace()
            false
        }
    }
}
