package com.komputerkit.socialmediaapp.model

data class SearchHistory(
    val query: String = "",
    val timestamp: Long = 0L,
    val type: SearchType = SearchType.USER
)

enum class SearchType {
    USER,
    HASHTAG
}
