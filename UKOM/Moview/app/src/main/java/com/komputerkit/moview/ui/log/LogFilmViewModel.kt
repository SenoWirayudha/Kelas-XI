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
    
    private val _isWatched = MutableLiveData<Boolean>(false) // Default to not watched
    val isWatched: LiveData<Boolean> = _isWatched
    
    private val _isRewatch = MutableLiveData<Boolean>(false)
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
                _movie.value = movieDetail
                Log.d("LogFilmViewModel", "Loaded movie from API: ${movieDetail.title}")
            } else {
                Log.e("LogFilmViewModel", "Failed to load movie details for id: $movieId")
            }
            
            // Load existing rating and like status if any
            if (currentUserId > 0) {
                // Load rating - if rating exists, movie is watched
                val ratingResponse = repository.getRating(currentUserId, movieId)
                if (ratingResponse != null && ratingResponse.is_watched) {
                    _isWatched.value = true
                    // Direct rating (0-5 stars)
                    _rating.value = ratingResponse.rating ?: 0
                    Log.d("LogFilmViewModel", "Loaded existing rating: ${ratingResponse.rating} stars, watched: true")
                }
                
                // Load liked status
                val isLiked = repository.checkLike(currentUserId, movieId)
                _isLiked.value = isLiked
                Log.d("LogFilmViewModel", "Loaded existing liked status: $isLiked")
            }
        }
    }
    
    fun setRating(stars: Int) {
        _rating.value = stars
    }
    
    fun toggleLike() {
        val movieId = _movie.value?.id ?: return
        
        viewModelScope.launch {
            if (currentUserId > 0) {
                val newLikeStatus = repository.toggleLike(currentUserId, movieId)
                if (newLikeStatus != null) {
                    _isLiked.value = newLikeStatus
                    Log.d("LogFilmViewModel", "Toggled like status: $newLikeStatus")
                    
                    // Auto-save rating=0 when liked (rating existence = watched)
                    if (newLikeStatus) {
                        repository.saveRating(currentUserId, movieId, 0)
                        _isWatched.value = true
                        Log.d("LogFilmViewModel", "Auto-saved rating=0 when liked (watched)")
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
                    _saveSuccess.value = success
                } else {
                    Log.e("LogFilmViewModel", "Cannot save rating: userId not found ($currentUserId)")
                }
            }
        } else {
            // Toggle to rewatch or unwatched
            _isRewatch.value = !(_isRewatch.value ?: false)
        }
    }
    
    fun saveLog(reviewText: String, containsSpoilers: Boolean) {
        val movieId = _movie.value?.id ?: return
        
        viewModelScope.launch {
            if (currentUserId > 0) {
                // Save rating directly (0-5 stars) - rating existence = watched
                val ratingValue = _rating.value ?: 0
                Log.d("LogFilmViewModel", "Saving log with rating: userId=$currentUserId, movieId=$movieId, rating=$ratingValue")
                val success = repository.saveRating(currentUserId, movieId, ratingValue)
                if (success) _isWatched.value = true
                Log.d("LogFilmViewModel", "Save log rating result: $success")
                
                // Save review if text is not empty
                if (reviewText.isNotBlank()) {
                    val reviewSuccess = repository.saveReview(
                        userId = currentUserId,
                        filmId = movieId,
                        reviewText = reviewText,
                        rating = ratingValue,
                        containsSpoilers = containsSpoilers
                    )
                    Log.d("LogFilmViewModel", "Save review result: $reviewSuccess")
                    _saveSuccess.value = success && reviewSuccess
                } else {
                    _saveSuccess.value = success
                }
            } else {
                Log.w("LogFilmViewModel", "Not saving rating: userId=$currentUserId, isWatched=${_isWatched.value}")
                _saveSuccess.value = true // Still allow log to be saved
            }
        }
    }
}
