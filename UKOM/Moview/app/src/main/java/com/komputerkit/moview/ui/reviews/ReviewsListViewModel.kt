package com.komputerkit.moview.ui.reviews

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

data class ReviewItem(
    val id: Int,
    val userId: Int,
    val username: String,
    val userAvatar: String,
    val rating: Float,
    val content: String,
    val timestamp: String,
    val isSpoiler: Boolean = false
)

class ReviewsListViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    private val _reviews = MutableLiveData<List<ReviewItem>>()
    val reviews: LiveData<List<ReviewItem>> = _reviews

    private val _userHasWatched = MutableLiveData<Boolean>()
    val userHasWatched: LiveData<Boolean> = _userHasWatched

    fun loadReviews(movieId: Int) {
        viewModelScope.launch {
            val userId = prefs.getInt("userId", 0)
            val dtos = repository.getMovieReviews(movieId)
            _reviews.postValue(dtos.map { dto ->
                ReviewItem(
                    id = dto.id,
                    userId = dto.user.id,
                    username = "@${dto.user.username}",
                    userAvatar = dto.user.profile_photo ?: "",
                    rating = dto.rating?.toFloat() ?: 0f,
                    content = dto.content ?: "",
                    timestamp = formatTimeAgo(dto.created_at),
                    isSpoiler = dto.is_spoiler
                )
            })
            // Check if the current user has watched this movie
            val ratingResponse = if (userId > 0) repository.getRating(userId, movieId) else null
            _userHasWatched.postValue(ratingResponse?.is_watched ?: false)
        }
    }

    private fun formatTimeAgo(dateString: String): String {
        return try {
            val format = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
            val date = format.parse(dateString) ?: return dateString
            val diffMs = java.util.Date().time - date.time
            val diffDays = (diffMs / (1000 * 60 * 60 * 24)).toInt()
            when {
                diffDays == 0 -> "today"
                diffDays == 1 -> "1d ago"
                diffDays < 7 -> "${diffDays}d ago"
                diffDays < 30 -> "${diffDays / 7}w ago"
                diffDays < 365 -> "${diffDays / 30}mo ago"
                else -> "${diffDays / 365}y ago"
            }
        } catch (e: Exception) {
            dateString
        }
    }
}
