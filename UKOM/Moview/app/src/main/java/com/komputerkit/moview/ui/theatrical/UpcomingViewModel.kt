package com.komputerkit.moview.ui.theatrical

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.TheatricalMovie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class UpcomingViewModel : ViewModel() {

    private val repository = MovieRepository()

    private val _movies = MutableLiveData<List<TheatricalMovie>>()
    val movies: LiveData<List<TheatricalMovie>> = _movies

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun loadMovies() {
        viewModelScope.launch {
            try {
                _loading.value = true
                _error.value = null
                _movies.value = repository.getUpcomingMovies()
            } catch (e: Exception) {
                _error.value = "Failed to load: ${e.message}"
                _movies.value = emptyList()
            } finally {
                _loading.value = false
            }
        }
    }
}
