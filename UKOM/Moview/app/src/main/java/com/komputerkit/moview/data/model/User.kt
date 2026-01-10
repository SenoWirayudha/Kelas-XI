package com.komputerkit.moview.data.model

data class User(
    val id: Int,
    val username: String,
    val profilePhotoUrl: String,
    val email: String = "",
    val bio: String = ""
)
