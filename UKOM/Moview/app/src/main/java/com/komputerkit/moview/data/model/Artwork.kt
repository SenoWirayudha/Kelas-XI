package com.komputerkit.moview.data.model

data class Artwork(
    val id: Int,
    val type: ArtworkType,
    val url: String,
    val label: String,
    val width: Int,
    val height: Int,
    val isSelected: Boolean = false,
    val isDefault: Boolean = false,
    val badgeLabels: List<String> = emptyList()
)

enum class ArtworkType {
    POSTER,
    BACKDROP
}
