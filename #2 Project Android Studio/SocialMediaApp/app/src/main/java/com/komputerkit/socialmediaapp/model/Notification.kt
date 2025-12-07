package com.komputerkit.socialmediaapp.model

data class Notification(
    val id: String = "",
    val userId: String = "", // To whom the notification belongs
    val type: String = "", // "like", "comment", "follow", "mention"
    val message: String = "",
    val timestamp: Long = 0L,
    val isRead: Boolean = false,
    val fromUserId: String = "", // Who triggered the notification
    val fromUserName: String = "",
    val fromUserProfileImage: String = "",
    val postId: String? = null, // For like notifications
    val postImageUrl: String? = null // Post thumbnail for like notifications
)

// Notification type constants
object NotificationTypes {
    const val LIKE = "like"
    const val FOLLOW = "follow"
    const val COMMENT = "comment"
    const val MENTION = "mention"
}

// Helper functions
fun Notification.getDisplayMessage(): String {
    return when (type) {
        NotificationTypes.LIKE -> "$fromUserName liked your post"
        NotificationTypes.FOLLOW -> "$fromUserName started following you"
        NotificationTypes.COMMENT -> "$fromUserName commented on your post"
        NotificationTypes.MENTION -> "$fromUserName mentioned you in a post"
        else -> message
    }
}

fun Notification.getTimeAgo(): String {
    val now = System.currentTimeMillis()
    val diff = now - timestamp

    return when {
        diff < 60000 -> "Just now"
        diff < 3600000 -> "${diff / 60000}m ago"
        diff < 86400000 -> "${diff / 3600000}h ago"
        diff < 604800000 -> "${diff / 86400000}d ago"
        else -> {
            val sdf = java.text.SimpleDateFormat("MMM dd", java.util.Locale.getDefault())
            sdf.format(java.util.Date(timestamp))
        }
    }
}
