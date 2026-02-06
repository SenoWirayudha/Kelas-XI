package com.komputerkit.moview.ui.review

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class ReviewViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _reviews = MutableLiveData<List<Review>>()
    val reviews: LiveData<List<Review>> = _reviews
    
    private val _reviewCount = MutableLiveData<Int>()
    val reviewCount: LiveData<Int> = _reviewCount
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    init {
        loadReviews()
    }
    
    private fun loadReviews() {
        val userId = prefs.getInt("userId", 0)
        android.util.Log.d("ReviewViewModel", "Loading reviews for userId: $userId")
        
        if (userId == 0) {
            android.util.Log.e("ReviewViewModel", "User ID is 0, not loading reviews")
            _reviews.value = emptyList()
            _reviewCount.value = 0
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                android.util.Log.d("ReviewViewModel", "Fetching reviews from API...")
                val userReviews = repository.getUserReviews(userId)
                android.util.Log.d("ReviewViewModel", "Fetched ${userReviews.size} reviews")
                
                // Convert UserReviewDto to Review model
                val reviewList = userReviews.map { dto ->
                    android.util.Log.d("ReviewViewModel", "Review: ${dto.review_id} - ${dto.title} - ${dto.content}")
                    
                    // Build full poster URL
                    val posterUrl = when {
                        dto.poster_path.isNullOrBlank() -> ""
                        dto.poster_path.startsWith("http") -> dto.poster_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${dto.poster_path}"
                    }
                    
                    val movie = Movie(
                        id = dto.id,
                        title = dto.title,
                        posterUrl = posterUrl,
                        averageRating = dto.rating?.toFloat() ?: 0f,
                        genre = "",
                        releaseYear = dto.year.toIntOrNull() ?: 0,
                        description = ""
                    )
                    
                    Review(
                        id = dto.review_id,
                        movie = movie,
                        rating = dto.rating?.toFloat() ?: 0f,
                        reviewText = dto.content,
                        reviewDate = dto.created_at,
                        dateLabel = formatDateLabel(dto.created_at),
                        userId = userId,
                        movieId = dto.id
                    )
                }
                
                android.util.Log.d("ReviewViewModel", "Converted to ${reviewList.size} Review objects")
                _reviews.postValue(reviewList)
                _reviewCount.postValue(reviewList.size)
            } catch (e: Exception) {
                android.util.Log.e("ReviewViewModel", "Error loading reviews: ${e.message}", e)
                _reviews.postValue(emptyList())
                _reviewCount.postValue(0)
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    private fun formatDateLabel(dateString: String): String {
        // Format: "Watched DD MMMM YYYY"
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("dd MMMM yyyy", Locale("id", "ID"))
            val date = inputFormat.parse(dateString)
            if (date != null) {
                "Watched ${outputFormat.format(date)}"
            } else {
                "Watched recently"
            }
        } catch (e: Exception) {
            android.util.Log.e("ReviewViewModel", "Error formatting date: ${e.message}")
            "Watched recently"
        }
    }
}
