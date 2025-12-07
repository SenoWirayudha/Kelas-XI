package com.komputerkit.newsnow.utils

import retrofit2.Response
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

// Resource sealed class untuk menangani state
sealed class Resource<T> {
    class Success<T>(val data: T) : Resource<T>()
    class Error<T>(val message: String) : Resource<T>()
    class Loading<T> : Resource<T>()
}

object NetworkUtils {
    
    fun <T> handleApiResponse(response: Response<T>): Resource<T> {
        return try {
            if (response.isSuccessful) {
                response.body()?.let { body ->
                    Resource.Success(body)
                } ?: Resource.Error("Empty response body")
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Bad request - Please check your input"
                    401 -> "API key is missing or invalid"
                    403 -> "Access forbidden - Check your API permissions"
                    404 -> "News not found"
                    429 -> "Rate limit exceeded - Please try again later"
                    500 -> "Server error - Please try again later"
                    else -> "Error ${response.code()}: ${response.message()}"
                }
                Resource.Error(errorMessage)
            }
        } catch (e: Exception) {
            Resource.Error(handleNetworkException(e))
        }
    }
    
    fun handleNetworkException(exception: Exception): String {
        return when (exception) {
            is UnknownHostException -> "No internet connection"
            is SocketTimeoutException -> "Request timeout - Check your connection"
            is IOException -> "Network error - Please try again"
            else -> exception.message ?: "Unknown error occurred"
        }
    }
}