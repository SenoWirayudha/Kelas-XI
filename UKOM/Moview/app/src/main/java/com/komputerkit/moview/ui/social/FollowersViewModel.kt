package com.komputerkit.moview.ui.social

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.UserProfile
import com.komputerkit.moview.data.repository.MovieRepository

class FollowersViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _followers = MutableLiveData<List<UserProfile>>()
    val followers: LiveData<List<UserProfile>> = _followers
    
    init {
        loadFollowers()
    }
    
    private fun loadFollowers() {
        _followers.value = repository.getFollowers()
    }
}
