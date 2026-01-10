package com.komputerkit.moview.ui.reviews

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

data class ReviewItem(
    val id: Int,
    val userId: Int,
    val username: String,
    val userAvatar: String,
    val rating: Float,
    val content: String,
    val timestamp: String
)

class ReviewsListViewModel : ViewModel() {
    
    private val _reviews = MutableLiveData<List<ReviewItem>>()
    val reviews: LiveData<List<ReviewItem>> = _reviews
    
    fun loadReviews(movieId: Int) {
        // TODO: Load actual reviews from repository
        // Placeholder dummy data
        _reviews.value = listOf(
            ReviewItem(
                id = 1,
                userId = 1,
                username = "@cinephile_99",
                userAvatar = "https://image.tmdb.org/t/p/w185/hUh4ugq6UUTUC03pKshXdQqKcR.jpg",
                rating = 5f,
                content = "The cinematography in this sequel is unparalleled. Villeneuve manages to capture the scale of Arrakis in a way that feels both intimate and grand. Greig Fraser's work deserves every accolade it receives.",
                timestamp = "2d ago"
            ),
            ReviewItem(
                id = 2,
                userId = 2,
                username = "@movie_buff_dan",
                userAvatar = "https://image.tmdb.org/t/p/w185/kU3B75TyRiCgE270EyZnHjfivoq.jpg",
                rating = 4f,
                content = "A technical masterpiece. The sound design alone is worth the price of admission. My only gripe is the pacing in the middle act, which felt a bit dragged out.",
                timestamp = "3d ago"
            ),
            ReviewItem(
                id = 3,
                userId = 3,
                username = "@film_fanatic",
                userAvatar = "https://image.tmdb.org/t/p/w185/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg",
                rating = 5f,
                content = "Absolutely breathtaking. I haven't seen world-building this immersive in years. It's a rare sequel that surpasses the original in every way. The cast is phenomenal.",
                timestamp = "4d ago"
            )
        )
    }
}
