package com.komputerkit.moview.ui.popular

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class PopularMoviesViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    private val _movies = MutableLiveData<List<Movie>>()
    val movies: LiveData<List<Movie>> = _movies

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun loadPopularMovies() {
        viewModelScope.launch {
            try {
                _loading.value = true
                _error.value = null
                val rawMovies = repository.getPopularMoviesThisWeekAll(limit = 50)
                val userId = prefs.getInt("userId", 0)
                val movies = if (userId > 0 && rawMovies.isNotEmpty()) {
                    val customMedia = repository.batchCustomMedia(userId, rawMovies.map { it.id }, "films")
                    rawMovies.applyCustomMedia(customMedia)
                } else {
                    rawMovies
                }
                _movies.value = movies
            } catch (e: Exception) {
                _error.value = "Failed to load movies: ${e.message}"
                _movies.value = emptyList()
            } finally {
                _loading.value = false
            }
        }
    }
}
