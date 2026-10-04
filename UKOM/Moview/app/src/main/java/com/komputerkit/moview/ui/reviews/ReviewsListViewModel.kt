package com.komputerkit.moview.ui.reviews

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class ReviewItem(
    val id: Int,
    val userId: Int,
    val username: String,
    val userAvatar: String,
    val rating: Float,
    val content: String,
    val timestamp: String,
    val isSpoiler: Boolean = false,
    val isLiked: Boolean = false
)

class ReviewsListViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    private val _reviews = MutableLiveData<List<ReviewItem>>()
    val reviews: LiveData<List<ReviewItem>> = _reviews

    private val _userHasWatched = MutableLiveData<Boolean>()
    val userHasWatched: LiveData<Boolean> = _userHasWatched

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private var loadedKey: String? = null
    private var loadJob: Job? = null
    private var refreshJob: Job? = null
    private var loadMoreJob: Job? = null
    private var currentPage = 1
    private var lastPage = 1
    private var allItems: List<ReviewItem> = emptyList()

    private val _isLoadingMore = MutableLiveData<Boolean>(false)
    val isLoadingMore: LiveData<Boolean> = _isLoadingMore

    fun loadReviews(movieId: Int) {
        val key = "reviews|$movieId"
        if (loadJob?.isActive == true) return
        if (key == loadedKey && _reviews.value != null) {
            if (refreshJob?.isActive == true) return
            if (loadMoreJob?.isActive == true) return
            refreshJob = viewModelScope.launch {
                try {
                    fetchReviews(movieId)
                    loadedKey = key
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    android.util.Log.e("ReviewsListVM", "Silent refresh failed", e)
                }
            }
            return
        }
        refreshJob?.cancel()
        loadMoreJob?.cancel()
        loadJob = viewModelScope.launch {
            _isLoading.value = true
            try {
                fetchReviews(movieId)
                loadedKey = key
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("ReviewsListVM", "Error loading reviews", e)
                if (_reviews.value == null) {
                    _reviews.postValue(emptyList())
                }
            } finally {
                if (isActive) _isLoading.postValue(false)
            }
        }
    }

    private suspend fun fetchReviews(movieId: Int) {
        val userId = prefs.getInt("userId", 0)
        android.util.Log.d("ReviewsListVM", "loadReviews: movieId=$movieId, userId=$userId")
        val slice = repository.getMovieReviewsPaged(movieId, 1)
        currentPage = slice.page
        lastPage = slice.lastPage
        android.util.Log.d("ReviewsListVM", "Got ${slice.items.size} reviews")
        allItems = slice.items.map { dto ->
            ReviewItem(
                id = dto.id,
                userId = dto.user.id,
                username = "@${dto.user.username}",
                userAvatar = dto.user.profile_photo ?: "",
                rating = dto.rating?.toFloat() ?: 0f,
                content = dto.content ?: "",
                timestamp = formatTimeAgo(dto.created_at),
                isSpoiler = dto.is_spoiler,
                isLiked = dto.is_liked
            )
        }
        _reviews.postValue(allItems)
        // Check if the current user has watched this movie
        val ratingResponse = if (userId > 0) repository.getRating(userId, movieId) else null
        _userHasWatched.postValue(ratingResponse?.is_watched ?: false)
    }

    /**
     * Infinite scroll: tarik halaman review berikutnya, akumulasi ke daftar.
     */
    fun loadMore(movieId: Int) {
        if (loadJob?.isActive == true || refreshJob?.isActive == true || loadMoreJob?.isActive == true) return
        if (_isLoadingMore.value == true) return
        if (currentPage >= lastPage) return
        if (loadedKey != "reviews|$movieId") return

        loadMoreJob = viewModelScope.launch {
            _isLoadingMore.postValue(true)
            try {
                val slice = repository.getMovieReviewsPaged(movieId, currentPage + 1)
                if (slice.items.isEmpty()) {
                    lastPage = currentPage
                    return@launch
                }
                currentPage = slice.page
                lastPage = slice.lastPage
                allItems = allItems + slice.items.map { dto ->
                    ReviewItem(
                        id = dto.id,
                        userId = dto.user.id,
                        username = "@${dto.user.username}",
                        userAvatar = dto.user.profile_photo ?: "",
                        rating = dto.rating?.toFloat() ?: 0f,
                        content = dto.content ?: "",
                        timestamp = formatTimeAgo(dto.created_at),
                        isSpoiler = dto.is_spoiler,
                        isLiked = dto.is_liked
                    )
                }
                _reviews.postValue(allItems)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("ReviewsListVM", "loadMore failed", e)
            } finally {
                if (isActive) _isLoadingMore.postValue(false)
            }
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
