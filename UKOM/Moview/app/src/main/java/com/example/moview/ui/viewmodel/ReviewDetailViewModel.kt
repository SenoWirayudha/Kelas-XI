package com.komputerkit.moview.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Comment
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.data.model.Movie

class ReviewDetailViewModel : ViewModel() {
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
        // TODO: Load from repository
        // Sample data for now
        val sampleMovie = Movie(
            id = 1,
            title = "Oppenheimer",
            posterUrl = "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
            averageRating = 5.0f,
            genre = "Biography",
            releaseYear = 2023,
            description = "",
            backdropUrl = "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg"
        )
        
        val sampleReview = Review(
            id = reviewId,
            movie = sampleMovie,
            movieId = 1,
            rating = 5.0f,
            reviewText = """A haunting masterpiece. Nolan delivers a spectacle that is both visually stunning and emotionally devastating.
                
Murphy's performance is career-defining, capturing the internal conflict of a man who changed the world forever. The sound design alone is worth the price of admission, creating an atmosphere of tension that is palpable from the very first frame.

The interplay between the black-and-white sequences and the vibrant color palette serves as a brilliant narrative device, separating the objective history from the subjective experience. It is not just a biopic; it is a warning.""",
            reviewDate = "2024-01-09",
            dateLabel = "Jan 9, 2024",
            userName = "Sarah Jenkins",
            userAvatar = "https://i.pravatar.cc/150?img=5",
            userId = 1,
            timeAgo = "Posted 2 hours ago",
            likeCount = 1200,
            commentCount = 24,
            hasTag = true,
            tag = "MASTERPIECE"
        )
        
        _review.value = sampleReview
        _likeCount.value = sampleReview.likeCount
        _isLiked.value = false
        _commentCount.value = sampleReview.commentCount

        loadComments(reviewId)
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
