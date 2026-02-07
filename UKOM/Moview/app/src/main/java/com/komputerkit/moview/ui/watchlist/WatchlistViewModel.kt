package com.komputerkit.moview.ui.watchlist

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class WatchlistViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _watchlistItems = MutableLiveData<List<WatchlistItem>>()
    val watchlistItems: LiveData<List<WatchlistItem>> = _watchlistItems
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private var allItems: List<WatchlistItem> = emptyList()
    
    init {
        loadWatchlist()
    }
    
    fun loadWatchlist() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val movies = repository.getUserWatchlist(userId)
                allItems = movies.map { movie ->
                    WatchlistItem(
                        id = movie.id,
                        movie = movie,
                        addedDate = "Recently",
                        isWatched = false
                    )
                }
                _watchlistItems.postValue(allItems)
            } catch (e: Exception) {
                e.printStackTrace()
                _watchlistItems.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    fun filterAllMovies() {
        _watchlistItems.value = allItems
    }
    
    fun filterByDateAdded() {
        _watchlistItems.value = allItems.sortedByDescending { it.addedDate }
    }
    
    fun filterUnwatched() {
        _watchlistItems.value = allItems.filter { !it.isWatched }
    }
}
