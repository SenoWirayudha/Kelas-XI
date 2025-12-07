package com.komputerkit.newsnow.data.api

import com.komputerkit.newsnow.data.model.NewsResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface NewsApiService {
    
    @GET("top-headlines")
    suspend fun getTopHeadlines(
        @Query("apiKey") apiKey: String,
        @Query("country") country: String = "us",
        @Query("category") category: String? = null,
        @Query("pageSize") pageSize: Int = 20
    ): Response<NewsResponse>
    
    @GET("everything")
    suspend fun searchNews(
        @Query("apiKey") apiKey: String,
        @Query("q") query: String,
        @Query("sortBy") sortBy: String = "publishedAt",
        @Query("pageSize") pageSize: Int = 20
    ): Response<NewsResponse>
}