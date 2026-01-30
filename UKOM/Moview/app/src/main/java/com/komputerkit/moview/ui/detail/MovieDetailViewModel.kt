package com.komputerkit.moview.ui.detail

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.CastMember
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.util.TmdbImageUrl
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class MovieDetailViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie
    
    private val _streamingServices = MutableLiveData<List<String>>()
    val streamingServices: LiveData<List<String>> = _streamingServices
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    fun loadMovieDetails(movieId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val movie = repository.getMovieDetail(movieId)
                if (movie != null) {
                    _movie.value = movie
                    // Load streaming services
                    _streamingServices.value = listOf("Netflix", "Prime", "YouTube", "MAX", "Disney+")
                } else {
                    _error.value = "Movie not found"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load movie details"
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
