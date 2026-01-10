package com.komputerkit.moview.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository

class HomeViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _popularMovies = MutableLiveData<List<Movie>>()
    val popularMovies: LiveData<List<Movie>> = _popularMovies
    
    private val _friendActivities = MutableLiveData<List<FriendActivity>>()
    val friendActivities: LiveData<List<FriendActivity>> = _friendActivities
    
    init {
        loadData()
    }
    
    private fun loadData() {
        _popularMovies.value = repository.getPopularMoviesThisWeek()
        _friendActivities.value = repository.getFriendActivities()
    }
    
    fun refreshData() {
        loadData()
    }
}
