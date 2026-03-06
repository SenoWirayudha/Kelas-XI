package com.komputerkit.moview.ui.popular

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class PopularMoviesViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movies = MutableLiveData<List<Movie>>()
    val movies: LiveData<List<Movie>> = _movies
    
    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    fun loadPopularMovies() {
        android.util.Log.d("PopularMoviesViewModel", "Loading popular movies this week (top 50)")
        
        viewModelScope.launch {
            try {
                _loading.value = true
                _error.value = null
                
                val result = repository.getPopularMoviesThisWeekAll(limit = 50)
                
                android.util.Log.d("PopularMoviesViewModel", "Received ${result.size} movies")
                _movies.value = result
                
            } catch (e: Exception) {
                android.util.Log.e("PopularMoviesViewModel", "Error loading popular movies", e)
                _error.value = "Failed to load movies: ${e.message}"
                _movies.value = emptyList()
            } finally {
                _loading.value = false
            }
        }
    }
}
