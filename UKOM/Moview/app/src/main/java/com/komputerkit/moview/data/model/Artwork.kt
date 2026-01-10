package com.komputerkit.moview.data.model

data class Artwork(
    val id: Int,
    val type: ArtworkType,
    val url: String,
    val label: String,
    val width: Int,
    val height: Int,
    val isSelected: Boolean = false
)

enum class ArtworkType {
    POSTER,
    BACKDROP
}
