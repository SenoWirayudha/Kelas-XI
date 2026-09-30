package com.komputerkit.moview.ui.detail

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class StreamingAvailabilityViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MovieRepository()

    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie

    private val _countryOptions = MutableLiveData<List<String>>(emptyList())
    val countryOptions: LiveData<List<String>> = _countryOptions

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>(null)
    val error: LiveData<String?> = _error

    fun load(movieId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val movie = repository.getMovieDetail(movieId)
                if (movie != null) {
                    _movie.value = movie
                } else {
                    _error.value = "Movie not found"
                }
                _countryOptions.value = repository.getFilterOptions().countries
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load streaming availability"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
