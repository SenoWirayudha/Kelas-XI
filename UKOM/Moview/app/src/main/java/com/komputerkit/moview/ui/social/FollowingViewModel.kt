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
    
    fun loadFollowing(userId: Int) {
        if (userId == 0) {
            _following.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val userFollows = repository.getUserFollowing(userId, prefs.getInt("userId", 0))
                
                // Convert UserFollowDto to UserProfile model
                val followingList = userFollows.map { dto ->
                    UserProfile(
                        id = dto.id,
                        username = dto.username,
                        avatarUrl = dto.profile_photo ?: "",
                        bio = dto.bio,
                        isFollowing = dto.is_following,
                        isMyself = dto.id == prefs.getInt("userId", 0)
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

    /** Follow/unfollow from a row button; flips the row optimistically then syncs. */
    fun toggleFollow(user: UserProfile) {
        val currentUserId = prefs.getInt("userId", 0)
        if (currentUserId <= 0 || user.id == currentUserId) return

        _following.value = (_following.value ?: emptyList()).map {
            if (it.id == user.id) it.copy(isFollowing = !it.isFollowing) else it
        }

        viewModelScope.launch {
            val target = !user.isFollowing
            val success = if (target) {
                repository.followUser(currentUserId, user.id)
            } else {
                repository.unfollowUser(currentUserId, user.id)
            }
            if (!success) {
                _following.postValue((_following.value ?: emptyList()).map {
                    if (it.id == user.id) it.copy(isFollowing = user.isFollowing) else it
                })
            }
        }
    }
}
