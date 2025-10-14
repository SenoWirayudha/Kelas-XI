package com.komputerkit.socialmediaapp.model

data class Comment(
    val id: String = "",
    val postId: String = "",
    val userId: String = "",
    val userName: String = "",
    val userProfileImage: String = "",
    val text: String = "",
    val timestamp: Long = 0L,
    val likedBy: List<String> = emptyList()
) {
    // Firestore memerlukan constructor tanpa parameter
    constructor() : this("", "", "", "", "", "", 0L, emptyList())
}
