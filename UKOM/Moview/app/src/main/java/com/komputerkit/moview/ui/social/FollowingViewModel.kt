package com.komputerkit.moview.ui.social

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.UserProfile
import com.komputerkit.moview.data.repository.MovieRepository

class FollowingViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _following = MutableLiveData<List<UserProfile>>()
    val following: LiveData<List<UserProfile>> = _following
    
    init {
        loadFollowing()
    }
    
    private fun loadFollowing() {
        _following.value = repository.getFollowing()
    }
}
