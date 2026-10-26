package com.komputerkit.moview.data.model

data class UserProfile(
    val id: Int,
    val username: String,
    val avatarUrl: String,
    val bio: String? = null,
    /** Whether the signed-in user follows this user (drives the row button). */
    val isFollowing: Boolean = false,
    /** True for the signed-in user's own row: no follow button. */
    val isMyself: Boolean = false
)