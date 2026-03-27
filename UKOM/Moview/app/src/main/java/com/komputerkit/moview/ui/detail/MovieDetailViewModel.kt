package com.komputerkit.moview.ui.detail

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.CastMember
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.util.TmdbImageUrl
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class MovieDetailViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie
    
    private val _streamingServices = MutableLiveData<List<String>>()
    val streamingServices: LiveData<List<String>> = _streamingServices
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _watchedByPreview = MutableLiveData<List<MovieDetailUserPreviewItem>>(emptyList())
    val watchedByPreview: LiveData<List<MovieDetailUserPreviewItem>> = _watchedByPreview

    private val _wantToWatchPreview = MutableLiveData<List<MovieDetailUserPreviewItem>>(emptyList())
    val wantToWatchPreview: LiveData<List<MovieDetailUserPreviewItem>> = _wantToWatchPreview
    
    fun loadMovieDetails(movieId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val movie = repository.getMovieDetail(movieId)
                if (movie != null) {
                    // Apply custom media (films-type) for this user
                    val userId = prefs.getInt("userId", 0)
                    val resolved = if (userId > 0) {
                        val customMedia = repository.batchCustomMedia(userId, listOf(movieId), "films")
                        listOf(movie).applyCustomMedia(customMedia).first()
                    } else movie
                    _movie.value = resolved
                    // Load streaming services
                    _streamingServices.value = listOf("Netflix", "Prime", "YouTube", "MAX", "Disney+")

                    loadSocialPreviews(movieId, userId)
                } else {
                    _error.value = "Movie not found"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load movie details"
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    private suspend fun loadSocialPreviews(movieId: Int, viewerUserId: Int) {
        if (viewerUserId <= 0) {
            _watchedByPreview.value = emptyList()
            _wantToWatchPreview.value = emptyList()
            return
        }

        val watchedFriends = repository.getMovieWatchedUsers(
            movieId = movieId,
            filter = "friends",
            viewerUserId = viewerUserId,
            limit = 10,
            prioritizeReview = true
        )

        _watchedByPreview.value = watchedFriends.map { dto ->
            MovieDetailUserPreviewItem(
                userId = dto.user.id,
                profilePhoto = dto.user.profile_photo,
                starsText = toStarText(dto.rating),
                reviewId = dto.review_id
            )
        }

        val wantToWatch = repository.getMovieFriendsWantToWatch(
            movieId = movieId,
            viewerUserId = viewerUserId,
            limit = 10
        )

        _wantToWatchPreview.value = wantToWatch.map { dto ->
            MovieDetailUserPreviewItem(
                userId = dto.id,
                profilePhoto = dto.profile_photo,
                starsText = "",
                reviewId = null
            )
        }
    }

    private fun toStarText(rating: Int?): String {
        if (rating == null || rating <= 0) return ""
        return "★".repeat(rating.coerceAtMost(5))
    }
}
