package com.komputerkit.moview.data.api

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.Field
import retrofit2.http.FormUrlEncoded
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface MovieApiService {
    
    // Authentication
    @POST("register")
    suspend fun register(@Body request: RegisterRequest): ApiResponse<LoginResponse>
    
    @POST("login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<LoginResponse>
    
    @POST("logout")
    suspend fun logout(): ApiResponse<Any>
    
    @GET("me")
    suspend fun getCurrentUser(): ApiResponse<UserInfoDto>
    
    @GET("home")
    suspend fun getHome(): ApiResponse<HomeResponse>
    
    @GET("popular")
    suspend fun getPopular(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<MovieCardDto>
    
    @GET("recent-reviews")
    suspend fun getRecentReviews(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<FriendReviewDto>
    
    @GET("movies")
    suspend fun getMovies(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<MovieCardDto>
    
    @GET("movies/{id}")
    suspend fun getMovieDetail(
        @Path("id") id: Int
    ): ApiResponse<MovieDetailDto>
    
    @GET("persons/{id}")
    suspend fun getPersonDetail(
        @Path("id") id: Int
    ): ApiResponse<PersonDetailDto>
    
    @GET("films/category")
    suspend fun getFilmsByCategory(
        @Query("type") type: String,
        @Query("value") value: String
    ): ApiResponse<List<MovieCardDto>>
    
    @GET("movies/{id}/media")
    suspend fun getMovieMedia(
        @Path("id") id: Int
    ): ApiResponse<MovieMediaDto>
    
    @GET("users/{userId}/profile")
    suspend fun getUserProfile(
        @Path("userId") userId: Int
    ): ApiResponse<UserProfileResponse>
    
    @PUT("users/{userId}/profile")
    suspend fun updateUserProfile(
        @Path("userId") userId: Int,
        @Body request: UpdateProfileRequest
    ): ApiResponse<ProfilePhotoResponse>
    
    @Multipart
    @POST("users/{userId}/profile/photo")
    suspend fun uploadProfilePhoto(
        @Path("userId") userId: Int,
        @Part photo: okhttp3.MultipartBody.Part
    ): ApiResponse<ProfilePhotoResponse>
    
    @retrofit2.http.DELETE("users/{userId}/profile/photo")
    suspend fun deleteProfilePhoto(
        @Path("userId") userId: Int
    ): SimpleResponse
    
    @PUT("users/{userId}/profile/backdrop")
    suspend fun updateUserBackdrop(
        @Path("userId") userId: Int,
        @Body request: UpdateBackdropRequest
    ): SimpleResponse
    
    @GET("users/{userId}/favorites")
    suspend fun getUserFavorites(
        @Path("userId") userId: Int
    ): ApiResponse<List<FavoriteMovieDetailDto>>
    
    @PUT("users/{userId}/favorites")
    suspend fun updateUserFavorites(
        @Path("userId") userId: Int,
        @Body request: UpdateFavoritesRequest
    ): SimpleResponse
    
    // User Activity Endpoints
    @GET("users/{userId}/films")
    suspend fun getUserFilms(
        @Path("userId") userId: Int
    ): ApiResponse<List<UserFilmDto>>
    
    @GET("users/{userId}/diary")
    suspend fun getUserDiary(
        @Path("userId") userId: Int
    ): ApiResponse<List<DiaryEntryDto>>
    
    @GET("users/{userId}/reviews")
    suspend fun getUserReviews(
        @Path("userId") userId: Int
    ): ApiResponse<List<UserReviewDto>>
    
    @GET("users/{userId}/reviews/{reviewId}")
    suspend fun getReviewDetail(
        @Path("userId") userId: Int,
        @Path("reviewId") reviewId: Int
    ): ApiResponse<ReviewDetailDto>

    @GET("users/{userId}/diary/{diaryId}")
    suspend fun getDiaryDetail(
        @Path("userId") userId: Int,
        @Path("diaryId") diaryId: Int
    ): ApiResponse<ReviewDetailDto>
    
    @GET("users/{userId}/movies/{movieId}/watch-count")
    suspend fun getWatchCount(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<WatchCountDto>
    
    @DELETE("users/{userId}/reviews/{reviewId}")
    suspend fun deleteReview(
        @Path("userId") userId: Int,
        @Path("reviewId") reviewId: Int
    ): ApiResponse<Unit>
    
    @DELETE("users/{userId}/diary/{diaryId}")
    suspend fun deleteDiary(
        @Path("userId") userId: Int,
        @Path("diaryId") diaryId: Int
    ): ApiResponse<Unit>

    @GET("users/{userId}/likes")
    suspend fun getUserLikes(
        @Path("userId") userId: Int
    ): ApiResponse<List<UserFilmDto>>
    
    @GET("users/{userId}/watchlist")
    suspend fun getUserWatchlist(
        @Path("userId") userId: Int
    ): ApiResponse<List<UserFilmDto>>
    
    @GET("users/{userId}/followers")
    suspend fun getUserFollowers(
        @Path("userId") userId: Int
    ): ApiResponse<List<UserFollowDto>>
    
    @GET("users/{userId}/following")
    suspend fun getUserFollowing(
        @Path("userId") userId: Int
    ): ApiResponse<List<UserFollowDto>>
    
    @POST("users/{userId}/follow/{targetUserId}")
    suspend fun followUser(
        @Path("userId") userId: Int,
        @Path("targetUserId") targetUserId: Int
    ): SimpleResponse
    
    @DELETE("users/{userId}/follow/{targetUserId}")
    suspend fun unfollowUser(
        @Path("userId") userId: Int,
        @Path("targetUserId") targetUserId: Int
    ): SimpleResponse
    
    @GET("users/{userId}/is-following/{targetUserId}")
    suspend fun isFollowing(
        @Path("userId") userId: Int,
        @Path("targetUserId") targetUserId: Int
    ): ApiResponse<FollowStatusResponse>
    
    // Rating endpoints
    @POST("users/{userId}/movies/{movieId}/rating")
    suspend fun saveRating(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int,
        @Body request: SaveRatingRequest
    ): ApiResponse<RatingResponse>
    
    @GET("users/{userId}/movies/{movieId}/rating")
    suspend fun getRating(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<RatingResponse>
    
    @DELETE("users/{userId}/movies/{movieId}/rating")
    suspend fun deleteRating(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): SimpleResponse
    
    // Like endpoints
    @POST("users/{userId}/movies/{movieId}/like")
    suspend fun toggleLike(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<LikeResponse>
    
    @GET("users/{userId}/movies/{movieId}/like")
    suspend fun checkLike(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<LikeResponse>
    
    // Watchlist endpoints
    @POST("users/{userId}/movies/{movieId}/watchlist")
    suspend fun toggleWatchlist(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<WatchlistResponse>
    
    @GET("users/{userId}/movies/{movieId}/watchlist")
    suspend fun checkWatchlist(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<WatchlistResponse>
    
    // Review endpoints
    @POST("users/{userId}/movies/{movieId}/review")
    @FormUrlEncoded
    suspend fun saveReview(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int,
        @Field("review") review: String,
        @Field("rating") rating: Int,
        @Field("contains_spoilers") containsSpoilers: Int,
        @Field("watched_at") watchedAt: String? = null,
        @Field("is_rewatch") isRewatch: Int = 0
    ): SimpleResponse
    
    @PUT("users/{userId}/reviews/{reviewId}")
    @FormUrlEncoded
    suspend fun updateReview(
        @Path("userId") userId: Int,
        @Path("reviewId") reviewId: Int,
        @Field("review") review: String,
        @Field("rating") rating: Int,
        @Field("contains_spoilers") containsSpoilers: Int,
        @Field("watched_at") watchedAt: String? = null
    ): SimpleResponse
    
    @GET("search")
    suspend fun search(
        @Query("q") query: String,
        @Query("type") type: String = "all"
    ): ApiResponse<SearchResponse>
    
    @GET("search")
    suspend fun searchMovies(
        @Query("q") query: String
    ): ApiResponse<List<MovieCardDto>>
    
    // Review Comments
    @GET("reviews/{reviewId}/comments")
    suspend fun getReviewComments(
        @Path("reviewId") reviewId: Int
    ): ApiResponse<List<ReviewCommentDto>>
    
    @FormUrlEncoded
    @POST("users/{userId}/reviews/{reviewId}/comments")
    suspend fun addReviewComment(
        @Path("userId") userId: Int,
        @Path("reviewId") reviewId: Int,
        @Field("comment") comment: String,
        @Field("parent_id") parentId: Int? = null
    ): ApiResponse<ReviewCommentDto>
    
    @DELETE("users/{userId}/comments/{commentId}")
    suspend fun deleteReviewComment(
        @Path("userId") userId: Int,
        @Path("commentId") commentId: Int
    ): ApiResponse<Any>
    
    // Review Likes
    @POST("users/{userId}/reviews/{reviewId}/like")
    suspend fun toggleReviewLike(
        @Path("userId") userId: Int,
        @Path("reviewId") reviewId: Int
    ): ApiResponse<ReviewLikeResponse>
    
    @GET("users/{userId}/reviews/{reviewId}/like")
    suspend fun checkReviewLike(
        @Path("userId") userId: Int,
        @Path("reviewId") reviewId: Int
    ): ApiResponse<ReviewLikeResponse>
    
    @GET("users/{userId}/movies/{movieId}/liked-reviews")
    suspend fun getLikedReviewsForMovie(
        @Path("userId") userId: Int,
        @Path("movieId") movieId: Int
    ): ApiResponse<List<LikedReviewDto>>
    
    // Notifications
    @GET("users/{userId}/notifications")
    suspend fun getNotifications(
        @Path("userId") userId: Int
    ): ApiResponse<NotificationResponse>
    
    @PUT("users/{userId}/notifications/{notificationId}/read")
    suspend fun markNotificationAsRead(
        @Path("userId") userId: Int,
        @Path("notificationId") notificationId: Int
    ): ApiResponse<Any>
    
    @PUT("users/{userId}/notifications/read-all")
    suspend fun markAllNotificationsAsRead(
        @Path("userId") userId: Int
    ): ApiResponse<Any>
}
