package com.komputerkit.moview.ui.social

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.UserProfile
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class FollowersViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _followers = MutableLiveData<List<UserProfile>>()
    val followers: LiveData<List<UserProfile>> = _followers
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    init {
        loadFollowers()
    }
    
    private fun loadFollowers() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) {
            _followers.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val userFollows = repository.getUserFollowers(userId)
                
                // Convert UserFollowDto to UserProfile model
                val followersList = userFollows.map { dto ->
                    UserProfile(
                        id = dto.id,
                        username = dto.username,
                        avatarUrl = dto.profile_photo ?: "",
                        bio = dto.bio
                    )
                }
                
                _followers.postValue(followersList)
            } catch (e: Exception) {
                _followers.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
}
