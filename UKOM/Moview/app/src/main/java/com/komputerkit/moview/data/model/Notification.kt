package com.komputerkit.moview.data.model

data class Notification(
    val id: Int,
    val userId: Int,
    val actorId: Int,
    val userName: String,
    val userAvatar: String,
    val message: String,
    val time: String,
    val moviePoster: String? = null,
    val movieTitle: String? = null,
    val filmId: Int? = null,
    val relatedId: Int? = null, // comment_id for comments
    val reviewId: Int? = null, // review_id for navigating to review
    val commentContent: String? = null, // content of comment/reply
    val isRead: Boolean = false,
    val type: NotificationType,
    val section: NotificationSection
)

enum class NotificationType {
    LIKE_REVIEW, COMMENT_REVIEW, REPLY_COMMENT, FOLLOW;
    
    companion object {
        fun fromString(value: String): NotificationType {
            return when (value.lowercase()) {
                "like_review" -> LIKE_REVIEW
                "comment_review" -> COMMENT_REVIEW
                "reply_comment" -> REPLY_COMMENT
                "follow" -> FOLLOW
                else -> FOLLOW
            }
        }
    }
}

enum class NotificationSection {
    TODAY, YESTERDAY, LAST_WEEK;
    
    companion object {
        fun fromString(value: String): NotificationSection {
            return when (value.lowercase()) {
                "today" -> TODAY
                "yesterday" -> YESTERDAY
                "last_week" -> LAST_WEEK
                else -> LAST_WEEK
            }
        }
    }
}
