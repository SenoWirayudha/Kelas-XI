package com.komputerkit.newsnow.data.repository

import com.komputerkit.newsnow.data.api.NewsApiClient
import com.komputerkit.newsnow.data.model.Article
import com.komputerkit.newsnow.utils.Constants
import com.komputerkit.newsnow.utils.NetworkUtils
import com.komputerkit.newsnow.utils.Resource
import com.komputerkit.newsnow.utils.RetryUtils
import com.komputerkit.newsnow.utils.RetryException

class NewsRepository {
    
    private val apiService = NewsApiClient.newsApiService
    
    suspend fun getTopHeadlines(category: String? = null): Resource<List<Article>> {
        return try {
            // Retry dengan exponential backoff untuk network failures
            RetryUtils.retryWithExponentialBackoff(
                times = 3,
                initialDelay = 1000L,
                maxDelay = 5000L
            ) {
                val response = apiService.getTopHeadlines(
                    apiKey = Constants.API_KEY,
                    country = Constants.DEFAULT_COUNTRY,
                    category = category,
                    pageSize = Constants.DEFAULT_PAGE_SIZE
                )
                
                if (response.isSuccessful) {
                    response.body()?.let { newsResponse ->
                        Resource.Success(newsResponse.articles)
                    } ?: throw RetryException("No data available", shouldRetry = false)
                } else {
                    val errorMessage = when (response.code()) {
                        401 -> "Invalid API key. Please check your News API key."
                        429 -> "Rate limit exceeded. Please try again later."
                        else -> "Error ${response.code()}: ${response.message()}"
                    }
                    // 4xx errors tidak perlu di-retry
                    val shouldRetry = response.code() !in 400..499
                    throw RetryException(errorMessage, shouldRetry)
                }
            }
        } catch (e: RetryException) {
            Resource.Error(e.message ?: "Failed to load news")
        } catch (e: Exception) {
            Resource.Error(NetworkUtils.handleNetworkException(e))
        }
    }
    
    suspend fun searchNews(query: String): Resource<List<Article>> {
        return try {
            // Validate query length untuk menghindari request yang tidak perlu
            if (query.length < 2) {
                return Resource.Error("Please enter at least 2 characters to search")
            }
            
            // Sanitize query untuk prevent injection
            val sanitizedQuery = query.trim().take(100) // Max 100 characters
            
            // Retry untuk search dengan parameter yang lebih konservatif
            RetryUtils.retryWithExponentialBackoff(
                times = 2, // Less retries untuk search
                initialDelay = 500L,
                maxDelay = 3000L
            ) {
                val response = apiService.searchNews(
                    apiKey = Constants.API_KEY,
                    query = sanitizedQuery,
                    sortBy = Constants.DEFAULT_SORT_BY,
                    pageSize = 15
                )
                
                if (response.isSuccessful) {
                    response.body()?.let { newsResponse ->
                        if (newsResponse.articles.isEmpty()) {
                            Resource.Error("No articles found for '$sanitizedQuery'")
                        } else {
                            Resource.Success(newsResponse.articles)
                        }
                    } ?: throw RetryException("No search results found", shouldRetry = false)
                } else {
                    val errorMessage = when (response.code()) {
                        400 -> "Invalid search query. Please try different keywords."
                        401 -> "API key error. Please check configuration."
                        429 -> "Too many requests. Please wait and try again."
                        500 -> "Server error. Please try again in a moment."
                        else -> "Search failed (${response.code()}). Please try again."
                    }
                    val shouldRetry = response.code() !in 400..499
                    throw RetryException(errorMessage, shouldRetry)
                }
            }
        } catch (e: RetryException) {
            Resource.Error(e.message ?: "Search failed")
        } catch (e: Exception) {
            Resource.Error("Search timeout. Please check your connection and try again.")
        }
    }
}