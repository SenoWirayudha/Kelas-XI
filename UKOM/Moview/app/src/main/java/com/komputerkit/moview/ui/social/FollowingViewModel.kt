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

class FollowingViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _following = MutableLiveData<List<UserProfile>>()
    val following: LiveData<List<UserProfile>> = _following
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    init {
        loadFollowing()
    }
    
    private fun loadFollowing() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) {
            _following.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val userFollows = repository.getUserFollowing(userId)
                
                // Convert UserFollowDto to UserProfile model
                val followingList = userFollows.map { dto ->
                    UserProfile(
                        id = dto.id,
                        username = dto.username,
                        avatarUrl = dto.profile_photo ?: "",
                        bio = dto.bio
                    )
                }
                
                _following.postValue(followingList)
            } catch (e: Exception) {
                _following.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
}
