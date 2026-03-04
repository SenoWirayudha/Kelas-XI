package com.komputerkit.moview.ui.home

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private var userId: Int = 0
    
    init {
        android.util.Log.d("HomeViewModel", "Initialized")
    }
    
    private val _popularMovies = MutableLiveData<List<Movie>>()
    val popularMovies: LiveData<List<Movie>> = _popularMovies
    
    private val _friendActivities = MutableLiveData<List<FriendActivity>>()
    val friendActivities: LiveData<List<FriendActivity>> = _friendActivities
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    fun setUserId(id: Int) {
        android.util.Log.d("HomeViewModel", "Setting userId: $id")
        userId = id
        loadData()
    }
    
    private fun loadData() {
        viewModelScope.launch {
            try {
                android.util.Log.d("HomeViewModel", "Loading data for userId: $userId")
                _isLoading.value = true
                _error.value = null
                
                // Load data dari API
                val movies = repository.getPopularMoviesThisWeek()
                android.util.Log.d("HomeViewModel", "Loaded ${movies.size} popular movies")
                
                val activities = if (userId > 0) {
                    android.util.Log.d("HomeViewModel", "Fetching friend activities for user $userId")
                    val result = repository.getFriendsActivity(userId)
                    android.util.Log.d("HomeViewModel", "Received ${result.size} friend activities")
                    result
                } else {
                    android.util.Log.w("HomeViewModel", "User ID is 0, not fetching friend activities")
                    emptyList()
                }
                
                _popularMovies.value = movies
                _friendActivities.value = activities
                android.util.Log.d("HomeViewModel", "Data loaded successfully")
                
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Error loading data", e)
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
