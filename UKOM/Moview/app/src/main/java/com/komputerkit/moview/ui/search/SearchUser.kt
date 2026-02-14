package com.komputerkit.moview.ui.search

data class SearchUser(
    val id: Int,
    val username: String,
    val fullName: String,
    val avatarUrl: String?,
    val filmsCount: Int = 0,
    val reviewsCount: Int = 0
)
