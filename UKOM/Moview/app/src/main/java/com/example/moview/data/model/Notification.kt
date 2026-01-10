package com.example.moview.data.model

data class Notification(
    val id: Int,
    val userId: Int,
    val userName: String,
    val userAvatar: String,
    val message: String,
    val time: String,
    val moviePoster: String? = null,
    val isRead: Boolean = false,
    val type: NotificationType,
    val section: NotificationSection
)

enum class NotificationType {
    LIKE, COMMENT, FOLLOW
}

enum class NotificationSection {
    TODAY, YESTERDAY, LAST_WEEK
}
