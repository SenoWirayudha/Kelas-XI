package com.komputerkit.moview.ui.home

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.TheatricalMovie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import com.komputerkit.moview.util.resolveMediaUrl
import kotlinx.coroutines.launch

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private var userId: Int = 0
    private var retryCount = 0
    private val maxRetries = 2
    
    init {
        android.util.Log.d("HomeViewModel", "Initialized")
    }
    
    private val _popularMovies = MutableLiveData<List<Movie>>()
    val popularMovies: LiveData<List<Movie>> = _popularMovies
    
    private val _friendActivities = MutableLiveData<List<FriendActivity>>()
    val friendActivities: LiveData<List<FriendActivity>> = _friendActivities

    private val _nowShowingMovies = MutableLiveData<List<TheatricalMovie>>()
    val nowShowingMovies: LiveData<List<TheatricalMovie>> = _nowShowingMovies

    private val _upcomingMovies = MutableLiveData<List<TheatricalMovie>>()
    val upcomingMovies: LiveData<List<TheatricalMovie>> = _upcomingMovies

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    var savedScrollY: Int = 0

    fun setUserId(id: Int) {
        android.util.Log.d("HomeViewModel", "Setting userId: $id")
        userId = id
        // Only load if data hasn't been fetched yet; on back-navigation the ViewModel
        // survives so we preserve the cached data (and scroll position).
        if (_popularMovies.value == null) {
            loadData()
        }
    }
    
    private fun loadData() {
        viewModelScope.launch {
            try {
                android.util.Log.d("HomeViewModel", "Loading data for userId: $userId (attempt ${retryCount + 1})")
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
                
                val nowShowing = repository.getNowShowingMovies(limit = 10)
                val upcoming = repository.getUpcomingMovies()

                // Apply custom media (films-type) for the current user's personalizations
                val theatricalIds = (nowShowing.map { it.id } + upcoming.map { it.id }).distinct()
                val allFilmIds = (movies.map { it.id } + theatricalIds).distinct()
                val customMedia = if (userId > 0 && allFilmIds.isNotEmpty()) {
                    repository.batchCustomMedia(userId, allFilmIds, "films")
                } else emptyMap()

                _popularMovies.value = movies.applyCustomMedia(customMedia)
                _friendActivities.value = activities
                _nowShowingMovies.value = nowShowing.map { movie ->
                    val entry = customMedia[movie.id] ?: return@map movie
                    val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                    if (customPoster != null) movie.copy(posterUrl = customPoster) else movie
                }
                _upcomingMovies.value = upcoming.map { movie ->
                    val entry = customMedia[movie.id] ?: return@map movie
                    val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                    if (customPoster != null) movie.copy(posterUrl = customPoster) else movie
                }
                retryCount = 0
                android.util.Log.d("HomeViewModel", "Data loaded successfully")
                
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Error loading data (attempt ${retryCount + 1})", e)
                
                if (retryCount < maxRetries) {
                    retryCount++
                    _isLoading.value = false
                    kotlinx.coroutines.delay(500)
                    loadData()
                    return@launch
                }
                
                _error.value = "Failed to load data: ${e.message}"
                retryCount = 0
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
