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
        // Load movie details
        val movies = repository.getPopularMoviesThisWeekDummy()
        _movie.value = movies.find { it.id == movieId } ?: movies.first()
        
        // Get user ID from SharedPreferences - use same name as Login
        val sharedPref = context.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        currentUserId = sharedPref.getInt("userId", 0)
        
        Log.d("LogFilmViewModel", "Retrieved userId from SharedPreferences: $currentUserId")
        
        // Load existing rating if any
        if (currentUserId > 0) {
            viewModelScope.launch {
                val ratingResponse = repository.getRating(currentUserId, movieId)
                if (ratingResponse != null) {
                    _isWatched.value = ratingResponse.is_watched
                    // Direct rating (0-5 stars)
                    _rating.value = ratingResponse.rating ?: 0
                    Log.d("LogFilmViewModel", "Loaded existing rating: ${ratingResponse.rating} stars, watched: ${ratingResponse.is_watched}")
                }
            }
        }
    }
    
    fun setRating(stars: Int) {
        _rating.value = stars
    }
    
    fun toggleLike() {
        _isLiked.value = !(_isLiked.value ?: false)
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
            if (currentUserId > 0 && _isWatched.value == true) {
                // Save rating directly (0-5 stars)
                val ratingValue = _rating.value ?: 0
                Log.d("LogFilmViewModel", "Saving log with rating: userId=$currentUserId, movieId=$movieId, rating=$ratingValue")
                val success = repository.saveRating(currentUserId, movieId, ratingValue)
                Log.d("LogFilmViewModel", "Save log rating result: $success")
                _saveSuccess.value = success
            } else {
                Log.w("LogFilmViewModel", "Not saving rating: userId=$currentUserId, isWatched=${_isWatched.value}")
                _saveSuccess.value = true // Still allow log to be saved
            }
        }
    }
}
