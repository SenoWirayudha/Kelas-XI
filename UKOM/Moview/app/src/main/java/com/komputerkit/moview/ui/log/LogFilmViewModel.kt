package com.komputerkit.moview.ui.log

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository

class LogFilmViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie
    
    private val _rating = MutableLiveData<Int>(0)
    val rating: LiveData<Int> = _rating
    
    private val _isLiked = MutableLiveData<Boolean>(false)
    val isLiked: LiveData<Boolean> = _isLiked
    
    private val _isWatched = MutableLiveData<Boolean>(true) // Default to watched
    val isWatched: LiveData<Boolean> = _isWatched
    
    private val _isRewatch = MutableLiveData<Boolean>(false)
    val isRewatch: LiveData<Boolean> = _isRewatch
    
    fun loadMovie(movieId: Int) {
        // In a real app, load from repository
        val movies = repository.getPopularMoviesThisWeek()
        _movie.value = movies.find { it.id == movieId } ?: movies.first()
    }
    
    fun setRating(stars: Int) {
        _rating.value = stars
    }
    
    fun toggleLike() {
        _isLiked.value = !(_isLiked.value ?: false)
    }
    
    fun toggleWatched() {
        val currentWatched = _isWatched.value ?: true
        if (currentWatched) {
            // Toggle to rewatch
            _isRewatch.value = true
            _isWatched.value = true
        } else {
            // Toggle back to watched
            _isRewatch.value = false
            _isWatched.value = true
        }
    }
    
    fun saveLog(reviewText: String, containsSpoilers: Boolean): Boolean {
        // In a real app, save to repository
        // For now, just return success
        return true
    }
}
