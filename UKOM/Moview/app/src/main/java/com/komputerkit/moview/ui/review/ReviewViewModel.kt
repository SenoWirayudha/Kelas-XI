package com.komputerkit.moview.ui.review

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.data.repository.MovieRepository

class ReviewViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _reviews = MutableLiveData<List<Review>>()
    val reviews: LiveData<List<Review>> = _reviews
    
    private val _reviewCount = MutableLiveData<Int>()
    val reviewCount: LiveData<Int> = _reviewCount
    
    init {
        loadReviews()
    }
    
    private fun loadReviews() {
        val reviewList = repository.getReviews()
        _reviews.value = reviewList
        _reviewCount.value = reviewList.size
    }
}
