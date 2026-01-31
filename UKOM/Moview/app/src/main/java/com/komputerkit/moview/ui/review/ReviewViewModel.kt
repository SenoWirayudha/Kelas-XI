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
        if (userId == 0) {
            _reviews.value = emptyList()
            _reviewCount.value = 0
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val userReviews = repository.getUserReviews(userId)
                
                // Convert UserReviewDto to Review model
                val reviewList = userReviews.map { dto ->
                    val movie = Movie(
                        id = dto.id,
                        title = dto.title,
                        posterUrl = dto.poster_path ?: "",
                        averageRating = dto.rating ?: 0f,
                        genre = "",
                        releaseYear = dto.year,
                        description = ""
                    )
                    
                    Review(
                        id = dto.review_id,
                        movie = movie,
                        rating = dto.rating ?: 0f,
                        reviewText = dto.content,
                        reviewDate = dto.created_at,
                        dateLabel = formatDateLabel(dto.created_at),
                        userId = userId,
                        movieId = dto.id
                    )
                }
                
                _reviews.postValue(reviewList)
                _reviewCount.postValue(reviewList.size)
            } catch (e: Exception) {
                _reviews.postValue(emptyList())
                _reviewCount.postValue(0)
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    private fun formatDateLabel(dateString: String): String {
        // TODO: Implement proper date formatting
        return "Recently"
    }
}
