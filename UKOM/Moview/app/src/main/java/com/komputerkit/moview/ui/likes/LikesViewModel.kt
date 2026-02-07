package com.komputerkit.moview.ui.likes

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class LikesViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private var allLikes: List<Movie> = emptyList()
    
    private val _likes = MutableLiveData<List<Movie>>()
    val likes: LiveData<List<Movie>> = _likes
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    init {
        loadLikes()
    }
    
    fun loadLikes() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) {
            _likes.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                allLikes = repository.getUserLikes(userId)
                _likes.postValue(allLikes)
            } catch (e: Exception) {
                e.printStackTrace()
                _likes.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    fun sortByDateLiked() {
        // Sort by most recently liked (assuming API returns in this order)
        _likes.value = allLikes
    }
    
    fun sortByHighestRated() {
        _likes.value = allLikes.sortedByDescending { it.averageRating }
    }
    
    fun filterByGenre() {
        // TODO: Implement genre filtering
        // For now, just show all
        _likes.value = allLikes
    }
}
