package com.komputerkit.moview.ui.watched

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

enum class WatchedUsersFilter(val apiValue: String) {
    EVERYONE("everyone"),
    LIKED("liked"),
    FRIENDS("friends")
}

class MovieWatchedUsersViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    private val _users = MutableLiveData<List<MovieWatchedUserItem>>(emptyList())
    val users: LiveData<List<MovieWatchedUserItem>> = _users

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    fun loadUsers(movieId: Int, filter: WatchedUsersFilter, entrySource: String = "watched_by") {
        viewModelScope.launch {
            _isLoading.value = true

            val viewerUserId = prefs.getInt("userId", 0)
            val isWantToWatchFriends = entrySource == "want_to_watch" && filter == WatchedUsersFilter.FRIENDS

            _users.value = if (isWantToWatchFriends) {
                repository.getMovieFriendsWantToWatch(movieId, viewerUserId, 50).map { dto ->
                    MovieWatchedUserItem(
                        userId = dto.id,
                        username = dto.username,
                        profilePhoto = dto.profile_photo,
                        starsText = "",
                        reviewId = null,
                        hasLike = false,
                        hasReview = false
                    )
                }
            } else {
                val dtoList = repository.getMovieWatchedUsers(movieId, filter.apiValue, viewerUserId)
                dtoList.map { dto ->
                    val reviewId = dto.review_id
                    MovieWatchedUserItem(
                        userId = dto.user.id,
                        username = dto.user.username,
                        profilePhoto = dto.user.profile_photo,
                        starsText = toStarText(dto.rating),
                        reviewId = reviewId,
                        hasLike = dto.has_like,
                        hasReview = (reviewId ?: 0) > 0
                    )
                }
            }

            _isLoading.value = false
        }
    }

    private fun toStarText(rating: Int?): String {
        if (rating == null || rating <= 0) return ""
        return "★".repeat(rating.coerceAtMost(5))
    }
}
