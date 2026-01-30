package com.komputerkit.moview.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _popularMovies = MutableLiveData<List<Movie>>()
    val popularMovies: LiveData<List<Movie>> = _popularMovies
    
    private val _friendActivities = MutableLiveData<List<FriendActivity>>()
    val friendActivities: LiveData<List<FriendActivity>> = _friendActivities
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    init {
        loadData()
    }
    
    private fun loadData() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                // Load data dari API
                val movies = repository.getPopularMoviesThisWeek()
                val activities = repository.getFriendActivities()
                
                _popularMovies.value = movies
                _friendActivities.value = activities
                
            } catch (e: Exception) {
                _error.value = "Failed to load data: ${e.message}"
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun refreshData() {
        loadData()
    }
}
