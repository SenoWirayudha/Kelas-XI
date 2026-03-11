package com.komputerkit.moview.ui.notification

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Notification
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.resolveMediaUrl
import kotlinx.coroutines.launch

class NotificationViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _notifications = MutableLiveData<List<Notification>>()
    val notifications: LiveData<List<Notification>> = _notifications
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _unreadCount = MutableLiveData<Int>(0)
    val unreadCount: LiveData<Int> = _unreadCount
    
    fun refresh() {
        loadNotifications()
    }
    
    fun loadNotifications() {
        val userId = prefs.getInt("userId", 0)
        android.util.Log.d("NotificationViewModel", "Loading notifications for userId: $userId")
        if (userId == 0) {
            android.util.Log.e("NotificationViewModel", "User ID is 0, cannot load notifications")
            return
        }
        
        viewModelScope.launch {
            try {
                _isLoading.postValue(true)
                val notifications = repository.getNotificationsAsync(userId)
                android.util.Log.d("NotificationViewModel", "Received ${notifications.size} notifications")

                // Apply custom media to notification posters (reviews type — notifications are about reviews)
                val filmIds = notifications.mapNotNull { it.filmId }.distinct()
                val customMedia = if (filmIds.isNotEmpty()) repository.batchCustomMedia(userId, filmIds, "reviews") else emptyMap()
                val resolved = if (customMedia.isNotEmpty()) notifications.map { notif ->
                    val filmId = notif.filmId ?: return@map notif
                    val entry = customMedia[filmId] ?: return@map notif
                    val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                    if (customPoster != null) notif.copy(moviePoster = customPoster) else notif
                } else notifications
                _notifications.postValue(resolved)
                _unreadCount.postValue(resolved.count { !it.isRead })
            } catch (e: Exception) {
                android.util.Log.e("NotificationViewModel", "Error loading notifications", e)
                e.printStackTrace()
                _notifications.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    fun markAllAsRead() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        viewModelScope.launch {
            try {
                val success = repository.markAllNotificationsAsRead(userId)
                if (success) {
                    _notifications.value = _notifications.value?.map {
                        it.copy(isRead = true)
                    }
                    _unreadCount.postValue(0)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    fun markAsRead(notificationId: Int) {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        viewModelScope.launch {
            try {
                val success = repository.markNotificationAsRead(userId, notificationId)
                if (success) {
                    _notifications.value = _notifications.value?.map {
                        if (it.id == notificationId) it.copy(isRead = true) else it
                    }
                    _unreadCount.postValue(_notifications.value?.count { !it.isRead } ?: 0)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
