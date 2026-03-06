package com.komputerkit.moview.ui.social

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class FriendActivitiesViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _activities = MutableLiveData<List<FriendActivity>>()
    val activities: LiveData<List<FriendActivity>> = _activities
    
    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    private var retryCount = 0
    private val maxRetries = 2
    
    fun loadFriendsActivities(userId: Int) {
        android.util.Log.d("FriendActivitiesViewModel", "Loading all friends activities for user $userId (attempt ${retryCount + 1})")
        
        viewModelScope.launch {
            try {
                _loading.value = true
                _error.value = null
                
                val result = repository.getAllFriendsActivity(userId)
                
                android.util.Log.d("FriendActivitiesViewModel", "Received ${result.size} activities")
                _activities.value = result
                retryCount = 0 // Reset on success
                
            } catch (e: Exception) {
                android.util.Log.e("FriendActivitiesViewModel", "Error loading activities (attempt ${retryCount + 1})", e)
                
                if (retryCount < maxRetries) {
                    retryCount++
                    _loading.value = false
                    // Auto-retry after short delay
                    kotlinx.coroutines.delay(500)
                    loadFriendsActivities(userId)
                    return@launch
                }
                
                _error.value = "Failed to load activities: ${e.message}"
                // Only set empty if we never had data (avoid wiping existing data on refresh error)
                if (_activities.value == null) {
                    _activities.value = emptyList()
                }
                retryCount = 0
            } finally {
                _loading.value = false
            }
        }
    }
}
