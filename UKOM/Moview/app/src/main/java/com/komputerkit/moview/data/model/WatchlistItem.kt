package com.komputerkit.moview.data.model

data class WatchlistItem(
    val id: Int,
    val movie: Movie,
    val addedDate: String,
    val isWatched: Boolean = false
)
