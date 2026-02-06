package com.komputerkit.moview.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Comment
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class ReviewDetailViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    private val _review = MutableLiveData<Review>()
    val review: LiveData<Review> = _review

    private val _comments = MutableLiveData<List<Comment>>()
    val comments: LiveData<List<Comment>> = _comments

    private val _likeCount = MutableLiveData<Int>()
    val likeCount: LiveData<Int> = _likeCount

    private val _isLiked = MutableLiveData<Boolean>()
    val isLiked: LiveData<Boolean> = _isLiked

    private val _commentCount = MutableLiveData<Int>()
    val commentCount: LiveData<Int> = _commentCount

    fun loadReview(reviewId: Int) {
        val userId = prefs.getInt("userId", 0)
        
        viewModelScope.launch {
            try {
                val reviewDto = repository.getReviewDetail(userId, reviewId)
                
                if (reviewDto != null) {
                    // Build full URLs
                    val posterUrl = when {
                        reviewDto.poster_path.isNullOrBlank() -> ""
                        reviewDto.poster_path.startsWith("http") -> reviewDto.poster_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${reviewDto.poster_path}"
                    }
                    
                    val backdropUrl = when {
                        reviewDto.backdrop_path.isNullOrBlank() -> ""
                        reviewDto.backdrop_path.startsWith("http") -> reviewDto.backdrop_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${reviewDto.backdrop_path}"
                    }
                    
                    val profilePhoto = when {
                        reviewDto.profile_photo.isNullOrBlank() -> ""
                        reviewDto.profile_photo.startsWith("http") -> reviewDto.profile_photo.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${reviewDto.profile_photo}"
                    }
                    
                    val movie = Movie(
                        id = reviewDto.movie_id,
                        title = reviewDto.title,
                        posterUrl = posterUrl,
                        averageRating = reviewDto.rating.toFloat(),
                        genre = "",
                        releaseYear = reviewDto.year.toIntOrNull() ?: 0,
                        description = "",
                        backdropUrl = backdropUrl
                    )
                    
                    val review = Review(
                        id = reviewDto.review_id,
                        movie = movie,
                        movieId = reviewDto.movie_id,
                        rating = reviewDto.rating.toFloat(),
                        reviewText = reviewDto.review_text,
                        reviewDate = reviewDto.created_at,
                        dateLabel = formatDateLabel(reviewDto.created_at),
                        userName = reviewDto.display_name ?: reviewDto.username,
                        userAvatar = profilePhoto,
                        userId = reviewDto.user_id,
                        timeAgo = formatTimeAgo(reviewDto.created_at),
                        likeCount = 0,
                        commentCount = 0,
                        hasTag = false,
                        tag = ""
                    )
                    
                    _review.postValue(review)
                    _likeCount.postValue(0)
                    _isLiked.postValue(false)
                    _commentCount.postValue(0)
                    
                    loadComments(reviewId)
                }
            } catch (e: Exception) {
                android.util.Log.e("ReviewDetailViewModel", "Error loading review: ${e.message}", e)
            }
        }
    }
    
    private fun formatDateLabel(dateString: String): String {
        // Simple date formatting - you can enhance this
        return try {
            val parts = dateString.split(" ")
            if (parts.isNotEmpty()) parts[0] else "Recently"
        } catch (e: Exception) {
            "Recently"
        }
    }
    
    private fun formatTimeAgo(dateString: String): String {
        // Format: "Watched DD MMMM YYYY"
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("dd MMMM yyyy", Locale("id", "ID"))
            val date = inputFormat.parse(dateString)
            if (date != null) {
                "Watched ${outputFormat.format(date)}"
            } else {
                "Watched recently"
            }
        } catch (e: Exception) {
            "Watched recently"
        }
    }

    private fun loadComments(reviewId: Int) {
        // Sample comments
        val sampleComments = listOf(
            Comment(
                id = 1,
                reviewId = reviewId,
                userId = 2,
                username = "Alex Cinephile",
                userAvatar = "https://i.pravatar.cc/150?img=12",
                commentText = "I totally agree with this take! The cinematography was stunning, especially in the desert sequences. It felt like I was actually there.",
                timeAgo = "2h ago",
                likeCount = 45
            ),
            Comment(
                id = 2,
                reviewId = reviewId,
                userId = 3,
                username = "MovieBuff99",
                userAvatar = "https://i.pravatar.cc/150?img=33",
                commentText = "Absolutely. Greig Fraser is a genius. The lighting in the Giedi Prime scenes was unreal.",
                timeAgo = "1h ago",
                likeCount = 12
            ),
            Comment(
                id = 3,
                reviewId = reviewId,
                userId = 4,
                username = "Sarah Films",
                userAvatar = "https://i.pravatar.cc/150?img=25",
                commentText = "I felt the pacing was a bit slow in the second act, but the ending made up for it. #Dune2",
                timeAgo = "3h ago",
                likeCount = 8
            ),
            Comment(
                id = 4,
                reviewId = reviewId,
                userId = 5,
                username = "John Doe",
                userAvatar = "https://i.pravatar.cc/150?img=68",
                commentText = "Does anyone know if they are planning a third one immediately? The books get really weird after this point.",
                timeAgo = "5h ago",
                likeCount = 24
            )
        )

        _comments.value = sampleComments
    }

    fun toggleLike() {
        val currentLiked = _isLiked.value ?: false
        val currentCount = _likeCount.value ?: 0

        _isLiked.value = !currentLiked
        _likeCount.value = if (!currentLiked) currentCount + 1 else currentCount - 1
    }

    fun toggleCommentLike(comment: Comment) {
        comment.isLiked = !comment.isLiked
        val updatedComments = _comments.value?.map {
            if (it.id == comment.id) {
                it.copy(
                    isLiked = comment.isLiked,
                    likeCount = if (comment.isLiked) it.likeCount + 1 else it.likeCount - 1
                )
            } else {
                it
            }
        }
        _comments.value = updatedComments ?: emptyList()
    }

    fun addComment(commentText: String) {
        val newComment = Comment(
            id = (_comments.value?.size ?: 0) + 1,
            reviewId = _review.value?.id ?: 0,
            userId = 999,
            username = "You",
            userAvatar = "https://i.pravatar.cc/150?img=1",
            commentText = commentText,
            timeAgo = "Just now",
            likeCount = 0
        )

        val updatedComments = (_comments.value ?: emptyList()).toMutableList()
        updatedComments.add(newComment)
        _comments.value = updatedComments
        _commentCount.value = updatedComments.size
    }
}
