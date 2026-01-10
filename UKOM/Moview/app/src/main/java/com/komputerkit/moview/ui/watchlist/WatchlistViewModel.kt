package com.komputerkit.moview.ui.watchlist

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.data.repository.MovieRepository

class WatchlistViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _watchlistItems = MutableLiveData<List<WatchlistItem>>()
    val watchlistItems: LiveData<List<WatchlistItem>> = _watchlistItems
    
    init {
        loadWatchlist()
    }
    
    private fun loadWatchlist() {
        _watchlistItems.value = repository.getWatchlistItems()
    }
    
    fun filterAllMovies() {
        _watchlistItems.value = repository.getWatchlistItems()
    }
    
    fun filterByDateAdded() {
        _watchlistItems.value = repository.getWatchlistItems().sortedByDescending { it.addedDate }
    }
    
    fun filterUnwatched() {
        _watchlistItems.value = repository.getWatchlistItems().filter { !it.isWatched }
    }
}
