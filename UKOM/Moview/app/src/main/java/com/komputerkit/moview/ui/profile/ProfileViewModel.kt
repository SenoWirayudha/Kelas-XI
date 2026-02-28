package com.komputerkit.moview.ui.profile

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class ProfileViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _favoriteMovies = MutableLiveData<List<Movie>>()
    val favoriteMovies: LiveData<List<Movie>> = _favoriteMovies
    
    private val _recentActivity = MutableLiveData<List<com.komputerkit.moview.data.model.DiaryEntry>>()
    val recentActivity: LiveData<List<com.komputerkit.moview.data.model.DiaryEntry>> = _recentActivity
    
    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> = _userName
    
    private val _bio = MutableLiveData<String>()
    val bio: LiveData<String> = _bio
    
    private val _location = MutableLiveData<String>()
    val location: LiveData<String> = _location
    
    private val _stats = MutableLiveData<UserStats>()
    val stats: LiveData<UserStats> = _stats
    
    private val _profilePhotoUrl = MutableLiveData<String?>()
    val profilePhotoUrl: LiveData<String?> = _profilePhotoUrl
    
    private val _backdropUrl = MutableLiveData<String?>()
    val backdropUrl: LiveData<String?> = _backdropUrl
    
    private val _isFollowing = MutableLiveData<Boolean>()
    val isFollowing: LiveData<Boolean> = _isFollowing
    
    private val _followActionResult = MutableLiveData<FollowActionResult?>()
    val followActionResult: LiveData<FollowActionResult?> = _followActionResult
    
    fun loadProfileData(userId: Int) {
        val targetUserId = if (userId > 0) userId else prefs.getInt("userId", 0)
        
        Log.d("ProfileViewModel", "=== START Loading profile for userId: $targetUserId ===")
        Log.d("ProfileViewModel", "SharedPreferences keys: ${prefs.all.keys}")
        
        if (targetUserId == 0) {
            // No user logged in, show empty state or use from SharedPreferences
            Log.w("ProfileViewModel", "No userId found, trying fallback")
            val username = prefs.getString("username", "User") ?: "User"
            _userName.postValue(username)
            return
        }
        
        viewModelScope.launch {
            try {
                Log.d("ProfileViewModel", "Calling API getUserProfile...")
                val profileData = repository.getUserProfile(targetUserId)
                
                Log.d("ProfileViewModel", "Profile data received: $profileData")
                Log.d("ProfileViewModel", "Is null? ${profileData == null}")
                
                if (profileData != null) {
                    // Update UI dari API response
                    val displayName = if (!profileData.profile.display_name.isNullOrBlank()) {
                        profileData.profile.display_name
                    } else {
                        profileData.user.username
                    }
                    
                    Log.d("ProfileViewModel", "=== Setting Profile Data ===")
                    Log.d("ProfileViewModel", "Username: $displayName")
                    Log.d("ProfileViewModel", "Bio: ${profileData.profile.bio}")
                    Log.d("ProfileViewModel", "Photo URL: ${profileData.profile.profile_photo_url}")
                    Log.d("ProfileViewModel", "Backdrop URL: ${profileData.profile.backdrop_url}")
                    Log.d("ProfileViewModel", "Favorites count: ${profileData.favorites.size}")
                    
                    _userName.postValue(displayName)
                    _bio.postValue(profileData.profile.bio ?: "")
                    _location.postValue(profileData.profile.location ?: "")
                    
                    // Set profile photo URL, use default drawable if null
                    _profilePhotoUrl.postValue(profileData.profile.profile_photo_url)
                    _backdropUrl.postValue(profileData.profile.backdrop_url)
                    
                    // Convert favorites ke Movie list
                    val favorites = profileData.favorites.map { fav ->
                        Log.d("ProfileViewModel", "Favorite: ${fav.title}, poster: ${fav.poster_path}")
                        
                        // Check if user has review for this movie
                        val userReview = repository.getUserReviewForMovie(targetUserId, fav.id)
                        
                        Movie(
                            id = fav.id,
                            title = fav.title,
                            posterUrl = fav.poster_path ?: "",
                            averageRating = 0f,
                            genre = "",
                            releaseYear = fav.year,
                            description = "",
                            hasReview = userReview != null,
                            reviewId = userReview?.review_id ?: 0,
                            userRating = 0f
                        )
                    }
                    Log.d("ProfileViewModel", "Posting ${favorites.size} favorites")
                    _favoriteMovies.postValue(favorites)
                    
                    // Stats dari API
                    Log.d("ProfileViewModel", "Stats - Films: ${profileData.statistics.films}, Diary: ${profileData.statistics.diary}")
                    _stats.postValue(UserStats(
                        films = profileData.statistics.films,
                        diary = profileData.statistics.diary,
                        reviews = profileData.statistics.reviews,
                        watchlist = profileData.statistics.watchlist,
                        lists = 0,
                        likes = profileData.statistics.likes,
                        followers = profileData.statistics.followers,
                        following = profileData.statistics.following,
                        totalRatings = profileData.statistics.total_ratings ?: 0,
                        rating5 = profileData.statistics.rating_distribution?.get("5") ?: 0,
                        rating4 = profileData.statistics.rating_distribution?.get("4") ?: 0,
                        rating3 = profileData.statistics.rating_distribution?.get("3") ?: 0,
                        rating2 = profileData.statistics.rating_distribution?.get("2") ?: 0,
                        rating1 = profileData.statistics.rating_distribution?.get("1") ?: 0
                    ))
                    
                    // Load recent activity from diary (latest 4 entries)
                    try {
                        val diaryEntries = repository.getUserDiary(targetUserId)
                        _recentActivity.postValue(diaryEntries.take(4))
                        Log.d("ProfileViewModel", "Loaded ${diaryEntries.take(4).size} recent diary entries")
                    } catch (e: Exception) {
                        Log.e("ProfileViewModel", "Error loading recent activity", e)
                        _recentActivity.postValue(emptyList())
                    }
                    
                    Log.d("ProfileViewModel", "=== Profile data loaded successfully ===")
                } else {
                    // API call failed, bisa tampilkan error atau fallback
                    Log.e("ProfileViewModel", "!!! Profile data is NULL from API !!!")
                    val fallbackUsername = prefs.getString("username", "User") ?: "User"
                    _userName.postValue(fallbackUsername)
                    _favoriteMovies.postValue(emptyList())
                    _recentActivity.postValue(emptyList())
                }
            } catch (e: Exception) {
                Log.e("ProfileViewModel", "!!! EXCEPTION loading profile !!!", e)
                Log.e("ProfileViewModel", "Error message: ${e.message}")
                Log.e("ProfileViewModel", "Stack trace: ${e.stackTraceToString()}")
                e.printStackTrace()
                val fallbackUsername = prefs.getString("username", "User") ?: "User"
                _userName.postValue(fallbackUsername)
                _favoriteMovies.postValue(emptyList())
                _recentActivity.postValue(emptyList())
            }
        }
    }
    
    fun checkFollowStatus(currentUserId: Int, targetUserId: Int) {
        Log.d("ProfileViewModel", "=== Checking Follow Status ===")
        Log.d("ProfileViewModel", "Current User: $currentUserId, Target User: $targetUserId")
        viewModelScope.launch {
            try {
                val following = repository.isFollowing(currentUserId, targetUserId)
                Log.d("ProfileViewModel", "Follow status result: $following")
                _isFollowing.postValue(following)
                Log.d("ProfileViewModel", "Posted follow status to LiveData: $following")
            } catch (e: Exception) {
                Log.e("ProfileViewModel", "Error checking follow status", e)
                Log.e("ProfileViewModel", "Error message: ${e.message}")
                _isFollowing.postValue(false)
            }
        }
    }
    
    fun toggleFollow(currentUserId: Int, targetUserId: Int) {
        viewModelScope.launch {
            try {
                val currentStatus = _isFollowing.value ?: false
                val success = if (currentStatus) {
                    // Currently following, so unfollow
                    repository.unfollowUser(currentUserId, targetUserId)
                } else {
                    // Not following, so follow
                    repository.followUser(currentUserId, targetUserId)
                }
                
                if (success) {
                    val newStatus = !currentStatus
                    _isFollowing.postValue(newStatus)
                    _followActionResult.postValue(FollowActionResult.Success(newStatus))
                    Log.d("ProfileViewModel", "Follow toggled successfully. New status: $newStatus")
                } else {
                    _followActionResult.postValue(FollowActionResult.Error("Failed to update follow status"))
                    Log.e("ProfileViewModel", "Failed to toggle follow")
                }
            } catch (e: Exception) {
                Log.e("ProfileViewModel", "Error toggling follow", e)
                _followActionResult.postValue(FollowActionResult.Error("Error: ${e.message}"))
            }
        }
    }
    
    fun clearFollowActionResult() {
        _followActionResult.value = null
    }
}

data class UserStats(
    val films: Int,
    val diary: Int,
    val reviews: Int,
    val watchlist: Int,
    val lists: Int,
    val likes: Int,
    val followers: Int,
    val following: Int,
    val totalRatings: Int,
    val rating5: Int,
    val rating4: Int,
    val rating3: Int,
    val rating2: Int,
    val rating1: Int
)

sealed class FollowActionResult {
    data class Success(val isFollowing: Boolean) : FollowActionResult()
    data class Error(val message: String) : FollowActionResult()
}

