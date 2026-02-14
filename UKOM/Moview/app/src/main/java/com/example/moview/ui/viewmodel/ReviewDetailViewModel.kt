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

    private val _isLog = MutableLiveData<Boolean>()
    val isLog: LiveData<Boolean> = _isLog
    
    // Track which comment is being replied to
    private val _replyingTo = MutableLiveData<Comment?>()
    val replyingTo: LiveData<Comment?> = _replyingTo

    fun loadReview(reviewId: Int, isLog: Boolean = false) {
        val userId = prefs.getInt("userId", 0)
        
        viewModelScope.launch {
            try {
                val reviewDto = if (isLog) {
                    repository.getDiaryDetail(userId, reviewId)
                } else {
                    repository.getReviewDetail(userId, reviewId)
                }
                
                if (reviewDto != null) {
                    // Determine if this is a log based on actual review_id from response
                    // If review_id is 0, it's a log (no review text)
                    // If review_id > 0, it's a review (has review text)
                    val isActuallyLog = reviewDto.review_id == 0
                    _isLog.postValue(isActuallyLog)
                    
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
                        averageRating = reviewDto.rating?.toFloat() ?: 0f,
                        genre = "",
                        releaseYear = reviewDto.year.toIntOrNull() ?: 0,
                        description = "",
                        backdropUrl = backdropUrl
                    )
                    
                    val review = Review(
                        id = if (isActuallyLog) reviewDto.diary_id else reviewDto.review_id,
                        movie = movie,
                        movieId = reviewDto.movie_id,
                        reviewId = reviewDto.review_id,
                        rating = reviewDto.rating?.toFloat() ?: 0f,
                        reviewText = reviewDto.review_text ?: "",
                        reviewDate = reviewDto.created_at,
                        dateLabel = formatDateLabel(reviewDto.created_at),
                        userName = reviewDto.display_name ?: reviewDto.username,
                        userAvatar = profilePhoto,
                        userId = reviewDto.user_id,
                        timeAgo = formatWatchedDate(reviewDto.watched_at ?: reviewDto.created_at, reviewDto.is_rewatched),
                        isLiked = reviewDto.snapshot_is_liked,  // Snapshot for icon next to stars
                        isRewatch = reviewDto.is_rewatched,
                        watchedAt = reviewDto.watched_at,
                        likeCount = reviewDto.like_count,
                        commentCount = reviewDto.comment_count,
                        hasTag = false,
                        tag = ""
                    )
                    
                    _review.postValue(review)
                    _likeCount.postValue(reviewDto.like_count)
                    _commentCount.postValue(reviewDto.comment_count)
                    
                    // Set current like status from review_likes table for like button
                    _isLiked.postValue(reviewDto.is_liked)
                    
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

    private fun formatWatchedDate(dateString: String, isRewatched: Boolean = false): String {
        // Format: "Watched DD MMMM YYYY" or "Rewatched DD MMMM YYYY"
        val prefix = if (isRewatched) "Rewatched" else "Watched"
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val outputFormat = SimpleDateFormat("dd MMMM yyyy", Locale("id", "ID"))
            val date = inputFormat.parse(dateString)
            if (date != null) {
                "$prefix ${outputFormat.format(date)}"
            } else {
                "$prefix recently"
            }
        } catch (e: Exception) {
            "$prefix recently"
        }
    }

    private fun loadComments(reviewId: Int) {
        viewModelScope.launch {
            try {
                val comments = repository.getReviewComments(reviewId)
                _comments.postValue(comments)
                // Calculate total count including replies
                val totalCount = comments.sumOf { 1 + it.replies.size }
                _commentCount.postValue(totalCount)
            } catch (e: Exception) {
                android.util.Log.e("ReviewDetailViewModel", "Error loading comments: ${e.message}", e)
                _comments.postValue(emptyList())
            }
        }
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
        val userId = prefs.getInt("userId", 0)
        val reviewId = _review.value?.id ?: return
        val parentId = _replyingTo.value?.id  // Get parent comment ID if replying
        
        viewModelScope.launch {
            try {
                val newComment = repository.addReviewComment(userId, reviewId, commentText, parentId)
                if (newComment != null) {
                    if (parentId != null) {
                        // This is a reply - need to add it to the parent's replies list
                        val updatedComments = _comments.value?.map { comment ->
                            if (comment.id == parentId) {
                                comment.replies.add(newComment)
                                comment
                            } else {
                                comment
                            }
                        }
                        _comments.postValue(updatedComments ?: emptyList())
                        // Recalculate total count including replies
                        val totalCount = (updatedComments ?: emptyList()).sumOf { 1 + it.replies.size }
                        _commentCount.postValue(totalCount)
                    } else {
                        // Top-level comment - add to the top of the list
                        val updatedComments = mutableListOf(newComment)
                        updatedComments.addAll(_comments.value ?: emptyList())
                        _comments.postValue(updatedComments)
                        // Calculate total count including replies
                        val totalCount = updatedComments.sumOf { 1 + it.replies.size }
                        _commentCount.postValue(totalCount)
                    }
                    // Clear reply target after successful comment
                    _replyingTo.postValue(null)
                }
            } catch (e: Exception) {
                // Handle error silently or log it
                e.printStackTrace()
            }
        }
    }
    
    fun setReplyTarget(comment: Comment) {
        _replyingTo.value = comment
    }
    
    fun clearReplyTarget() {
        _replyingTo.value = null
    }
    
    private val _deleteStatus = MutableLiveData<Boolean>()
    val deleteStatus: LiveData<Boolean> = _deleteStatus
    
    fun deleteEntry(reviewId: Int, diaryId: Int) {
        val userId = prefs.getInt("userId", 0)
        viewModelScope.launch {
            try {
                val success = if (reviewId > 0) {
                    // Delete review (also deletes diary)
                    repository.deleteReview(userId, reviewId)
                } else {
                    // Delete diary entry only
                    repository.deleteDiary(userId, diaryId)
                }
                _deleteStatus.postValue(success)
            } catch (e: Exception) {
                _deleteStatus.postValue(false)
            }
        }
    }
    
    // Legacy method for backward compatibility
    fun deleteReview(reviewId: Int) {
        deleteEntry(reviewId, 0)
    }
}
