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
    
    fun loadFollowers(userId: Int) {
        if (userId == 0) {
            _followers.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val userFollows = repository.getUserFollowers(userId, prefs.getInt("userId", 0))
                
                // Convert UserFollowDto to UserProfile model
                val followersList = userFollows.map { dto ->
                    UserProfile(
                        id = dto.id,
                        username = dto.username,
                        avatarUrl = dto.profile_photo ?: "",
                        bio = dto.bio,
                        isFollowing = dto.is_following,
                        isMyself = dto.id == prefs.getInt("userId", 0)
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

    /** Follow/unfollow from a row button; flips the row optimistically then syncs. */
    fun toggleFollow(user: UserProfile) {
        val currentUserId = prefs.getInt("userId", 0)
        if (currentUserId <= 0 || user.id == currentUserId) return

        val updated = (_followers.value ?: emptyList()).map {
            if (it.id == user.id) it.copy(isFollowing = !it.isFollowing) else it
        }
        _followers.value = updated

        viewModelScope.launch {
            val target = !user.isFollowing
            val success = if (target) {
                repository.followUser(currentUserId, user.id)
            } else {
                repository.unfollowUser(currentUserId, user.id)
            }
            if (!success) {
                // Revert on failure.
                _followers.postValue((_followers.value ?: emptyList()).map {
                    if (it.id == user.id) it.copy(isFollowing = user.isFollowing) else it
                })
            }
        }
    }
}
