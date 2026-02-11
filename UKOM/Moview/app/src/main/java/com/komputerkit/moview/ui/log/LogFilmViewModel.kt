package com.komputerkit.moview.ui.log

import android.content.Context
import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class LogFilmViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie
    
    private val _rating = MutableLiveData<Int>(0)
    val rating: LiveData<Int> = _rating
    
    private val _isLiked = MutableLiveData<Boolean>(false)
    val isLiked: LiveData<Boolean> = _isLiked
    
    private val _isWatched = MutableLiveData<Boolean>(false) // From ratings table (icon watch state)
    val isWatched: LiveData<Boolean> = _isWatched
    
    private val _isRewatch = MutableLiveData<Boolean>(false) // From watchCount > 0 (for label REWATCHED)
    val isRewatch: LiveData<Boolean> = _isRewatch
    
    private val _saveSuccess = MutableLiveData<Boolean>()
    val saveSuccess: LiveData<Boolean> = _saveSuccess
    
    private var currentUserId: Int = -1
    
    fun loadMovie(movieId: Int, context: Context) {
        // Get user ID from SharedPreferences - use same name as Login
        val sharedPref = context.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        currentUserId = sharedPref.getInt("userId", 0)
        
        Log.d("LogFilmViewModel", "Retrieved userId from SharedPreferences: $currentUserId")
        
        viewModelScope.launch {
            // Load movie details from API
            val movieDetail = repository.getMovieDetail(movieId)
            if (movieDetail != null) {
                _movie.postValue(movieDetail)
                Log.d("LogFilmViewModel", "Loaded movie from API: ${movieDetail.title}")
            } else {
                Log.e("LogFilmViewModel", "Failed to load movie details for id: $movieId")
            }
            
            // Load existing rating and like status if any
            if (currentUserId > 0) {
                // Load rating - if exists in ratings table, movie is "watched" (for icon state)
                val ratingResponse = repository.getRating(currentUserId, movieId)
                if (ratingResponse != null && ratingResponse.is_watched) {
                    _isWatched.postValue(true)
                    val existingRating = ratingResponse.rating ?: 0
                    _rating.postValue(existingRating)
                    Log.d("LogFilmViewModel", "Movie is watched (from ratings table). Rating: $existingRating stars")
                } else {
                    _isWatched.postValue(false)
                    Log.d("LogFilmViewModel", "Movie not watched (no entry in ratings table)")
                }
                
                // Check watch count from diary entries to determine if this is REWATCH
                val watchCount = repository.getWatchCount(currentUserId, movieId)
                if (watchCount > 0) {
                    _isRewatch.postValue(true)
                    Log.d("LogFilmViewModel", "User has logged this movie $watchCount time(s) - this is REWATCH")
                } else {
                    _isRewatch.postValue(false)
                    Log.d("LogFilmViewModel", "First time logging this movie - NOT rewatch")
                }
                
                // Load liked status
                val isLiked = repository.checkLike(currentUserId, movieId)
                _isLiked.postValue(isLiked)
                Log.d("LogFilmViewModel", "Loaded existing liked status: $isLiked")
            }
        }
    }
    
    fun setRating(stars: Int) {
        _rating.value = stars
        Log.d("LogFilmViewModel", "Rating set to: $stars stars")
    }
    
    fun toggleLike() {
        val movieId = _movie.value?.id ?: return
        
        viewModelScope.launch {
            if (currentUserId > 0) {
                val newLikeStatus = repository.toggleLike(currentUserId, movieId)
                if (newLikeStatus != null) {
                    _isLiked.postValue(newLikeStatus)
                    Log.d("LogFilmViewModel", "Toggled like status: $newLikeStatus")
                    
                    // Don't auto-save rating when liked - let user choose rating first
                    // Just mark as watched if liked
                    if (newLikeStatus) {
                        _isWatched.postValue(true)
                        Log.d("LogFilmViewModel", "Marked as watched when liked (no rating override)")
                    }
                }
            }
        }
    }
    
    fun toggleWatched() {
        val currentWatched = _isWatched.value ?: false
        val movieId = _movie.value?.id ?: return
        
        if (!currentWatched) {
            // Mark as watched
            _isWatched.value = true
            
            // Save to database
            viewModelScope.launch {
                if (currentUserId > 0) {
                    // Save rating directly (0-5 stars)
                    val ratingValue = _rating.value ?: 0
                    Log.d("LogFilmViewModel", "Saving rating: userId=$currentUserId, movieId=$movieId, rating=$ratingValue")
                    val success = repository.saveRating(currentUserId, movieId, ratingValue)
                    Log.d("LogFilmViewModel", "Save rating result: $success")
                    _saveSuccess.postValue(success)
                } else {
                    Log.e("LogFilmViewModel", "Cannot save rating: userId not found ($currentUserId)")
                }
            }
        } else {
            // Toggle to rewatch or unwatched
            _isRewatch.value = !(_isRewatch.value ?: false)
        }
    }
    
    fun saveLog(reviewText: String, containsSpoilers: Boolean, watchedAt: String? = null, isRewatch: Boolean = false) {
        val movieId = _movie.value?.id ?: return
        
        viewModelScope.launch {
            if (currentUserId > 0) {
                val ratingValue = _rating.value ?: 0
                Log.d("LogFilmViewModel", "Saving log/review: userId=$currentUserId, movieId=$movieId, rating=$ratingValue, hasReview=${reviewText.isNotBlank()}, isRewatch=$isRewatch")
                
                // Save to review endpoint (handles both review and log + diaries table)
                val success = repository.saveReview(
                    userId = currentUserId,
                    filmId = movieId,
                    reviewText = reviewText, // Can be empty for log
                    rating = ratingValue,
                    containsSpoilers = containsSpoilers,
                    watchedAt = watchedAt,
                    isRewatch = isRewatch
                )
                
                if (success) {
                    _isWatched.postValue(true)
                    Log.d("LogFilmViewModel", "Save ${if (isRewatch) "rewatch" else if (reviewText.isNotBlank()) "review" else "log"} success")
                } else {
                    Log.e("LogFilmViewModel", "Failed to save ${if (isRewatch) "rewatch" else if (reviewText.isNotBlank()) "review" else "log"}")
                }
                
                _saveSuccess.postValue(success)
            } else {
                Log.e("LogFilmViewModel", "Cannot save: userId not found ($currentUserId)")
                _saveSuccess.postValue(false)
            }
        }
    }
    
    fun updateReview(reviewId: Int, reviewText: String, containsSpoilers: Boolean, rating: Int, watchedAt: String? = null) {
        viewModelScope.launch {
            if (currentUserId > 0) {
                Log.d("LogFilmViewModel", "Updating review: userId=$currentUserId, reviewId=$reviewId, rating=$rating")
                
                val success = repository.updateReview(
                    userId = currentUserId,
                    reviewId = reviewId,
                    reviewText = reviewText,
                    rating = rating,
                    containsSpoilers = containsSpoilers,
                    watchedAt = watchedAt
                )
                
                if (success) {
                    Log.d("LogFilmViewModel", "Update review success")
                } else {
                    Log.e("LogFilmViewModel", "Failed to update review")
                }
                
                _saveSuccess.postValue(success)
            } else {
                Log.e("LogFilmViewModel", "Cannot update: userId not found ($currentUserId)")
                _saveSuccess.postValue(false)
            }
        }
    }
}
