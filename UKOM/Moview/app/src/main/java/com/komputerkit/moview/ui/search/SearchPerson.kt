package com.komputerkit.moview.ui.search

data class SearchPerson(
    val id: Int,
    val name: String,
    val role: String,
    val knownFor: String = "",
    val avatarUrl: String
)
