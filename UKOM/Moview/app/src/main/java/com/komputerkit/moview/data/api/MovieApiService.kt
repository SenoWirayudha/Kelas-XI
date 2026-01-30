package com.komputerkit.moview.data.api

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface MovieApiService {
    
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
    
    @GET("search")
    suspend fun searchMovies(
        @Query("q") query: String
    ): ApiResponse<List<MovieCardDto>>
}
