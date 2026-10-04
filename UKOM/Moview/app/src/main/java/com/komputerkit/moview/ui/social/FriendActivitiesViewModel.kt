package com.komputerkit.moview.ui.social

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
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

    private var loadedKey: String? = null
    private var loadJob: Job? = null
    private var refreshJob: Job? = null
    private var loadMoreJob: Job? = null
    private var currentPage = 1
    private var lastPage = 1
    private var allActivities: List<FriendActivity> = emptyList()

    private val _isLoadingMore = MutableLiveData<Boolean>(false)
    val isLoadingMore: LiveData<Boolean> = _isLoadingMore

    fun loadFriendsActivities(userId: Int) {
        android.util.Log.d("FriendActivitiesViewModel", "Loading all friends activities for user $userId (attempt ${retryCount + 1})")

        val key = "friendact|$userId"
        if (loadJob?.isActive == true) return
        if (key == loadedKey && _activities.value != null) {
            if (refreshJob?.isActive == true) return
            if (loadMoreJob?.isActive == true) return
            refreshJob = viewModelScope.launch {
                try {
                    fetchActivities(userId, silent = true)
                    loadedKey = key
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    android.util.Log.e("FriendActivitiesViewModel", "Silent refresh failed", e)
                }
            }
            return
        }
        refreshJob?.cancel()
        loadMoreJob?.cancel()
        loadJob = viewModelScope.launch {
            _loading.value = true
            try {
                fetchActivities(userId, silent = false)
                loadedKey = key
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("FriendActivitiesViewModel", "Error loading activities", e)
                _error.value = "Failed to load activities: ${e.message}"
                if (_activities.value == null) {
                    _activities.value = emptyList()
                }
                retryCount = 0
            } finally {
                if (isActive) _loading.value = false
            }
        }
    }

    private suspend fun fetchActivities(userId: Int, silent: Boolean) {
        _error.value = null
        while (true) {
            try {
                val slice = repository.getAllFriendsActivityPaged(userId, 1)
                currentPage = slice.page
                lastPage = slice.lastPage
                allActivities = slice.items

                android.util.Log.d("FriendActivitiesViewModel", "Received ${allActivities.size} activities")
                _activities.value = allActivities
                retryCount = 0 // Reset on success
                return
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("FriendActivitiesViewModel", "Error loading activities (attempt ${retryCount + 1})", e)

                if (retryCount < maxRetries) {
                    retryCount++
                    // Auto-retry after short delay
                    delay(500)
                    continue
                }

                if (!silent) {
                    _error.value = "Failed to load activities: ${e.message}"
                    // Only set empty if we never had data (avoid wiping existing data on refresh error)
                    if (_activities.value == null) {
                        _activities.value = emptyList()
                    }
                }
                retryCount = 0
                return
            }
        }
    }

    /**
     * Infinite scroll: tarik halaman berikutnya, akumulasi ke daftar.
     */
    fun loadMore(userId: Int) {
        if (loadJob?.isActive == true || refreshJob?.isActive == true || loadMoreJob?.isActive == true) return
        if (_isLoadingMore.value == true) return
        if (currentPage >= lastPage) return
        if (loadedKey != "friendact|$userId") return

        loadMoreJob = viewModelScope.launch {
            _isLoadingMore.value = true
            try {
                val slice = repository.getAllFriendsActivityPaged(userId, currentPage + 1)
                if (slice.items.isEmpty()) {
                    lastPage = currentPage
                    return@launch
                }
                currentPage = slice.page
                lastPage = slice.lastPage
                allActivities = allActivities + slice.items
                _activities.value = allActivities
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("FriendActivitiesViewModel", "loadMore failed", e)
            } finally {
                if (isActive) _isLoadingMore.value = false
            }
        }
    }
}
