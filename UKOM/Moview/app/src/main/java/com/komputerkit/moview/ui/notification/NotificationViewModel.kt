package com.komputerkit.moview.ui.notification

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Notification
import com.komputerkit.moview.data.repository.MovieRepository

class NotificationViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _notifications = MutableLiveData<List<Notification>>()
    val notifications: LiveData<List<Notification>> = _notifications
    
    init {
        loadNotifications()
    }
    
    private fun loadNotifications() {
        _notifications.value = repository.getNotifications()
    }
    
    fun markAllAsRead() {
        _notifications.value = _notifications.value?.map {
            it.copy(isRead = true)
        }
    }
}
