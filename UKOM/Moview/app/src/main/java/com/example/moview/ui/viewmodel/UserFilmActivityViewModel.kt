package com.komputerkit.moview.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Diary
import com.komputerkit.moview.data.model.ReviewData
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class UserFilmActivityViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _activityTitle = MutableLiveData<String>()
    val activityTitle: LiveData<String> = _activityTitle
    
    private val _diaries = MutableLiveData<List<Diary>>()
    val diaries: LiveData<List<Diary>> = _diaries
    
    private val _reviews = MutableLiveData<List<ReviewData>>()
    val reviews: LiveData<List<ReviewData>> = _reviews
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    fun loadUserFilmActivity(userId: Int, filmId: Int) {
        android.util.Log.d("UserFilmActivityVM", "loadUserFilmActivity called - userId: $userId, filmId: $filmId")
        _isLoading.postValue(true)
        
        viewModelScope.launch {
            try {
                val response = repository.getUserFilmActivity(userId, filmId)
                
                android.util.Log.d("UserFilmActivityVM", "Response received: ${response != null}")
                
                if (response != null) {
                    // Set title: "{username}'s Activity for {movie title}"
                    val titleText = "${response.user.display_name}'s Activity for ${response.movie.title}"
                    _activityTitle.postValue(titleText)
                    
                    android.util.Log.d("UserFilmActivityVM", "Title: $titleText")
                    android.util.Log.d("UserFilmActivityVM", "Diaries count: ${response.diaries.size}")
                    android.util.Log.d("UserFilmActivityVM", "Reviews count: ${response.reviews.size}")
                    
                    // Convert DTOs to domain models
                    val diaryList = response.diaries.map { dto ->
                        Diary(
                            diary_id = dto.diary_id,
                            movie_id = dto.movie_id,
                            title = dto.title,
                            year = dto.year,
                            poster_path = dto.poster_path,
                            watched_at = dto.watched_at,
                            note = dto.note,
                            rating = dto.rating,
                            is_liked = dto.is_liked,
                            is_rewatched = dto.is_rewatched,
                            review_id = dto.review_id,
                            review_text = dto.review_content,
                            type = dto.type
                        )
                    }
                    
                    val reviewList = response.reviews.map { dto ->
                        ReviewData(
                            review_id = dto.review_id,
                            movie_id = dto.movie_id,
                            title = dto.title,
                            year = dto.year,
                            poster_path = dto.poster_path,
                            rating = dto.rating,
                            is_liked = dto.is_liked,
                            watched_at = dto.watched_at,
                            review_title = dto.review_title,
                            content = dto.content,
                            is_spoiler = dto.is_spoiler,
                            created_at = dto.created_at
                        )
                    }
                    
                    android.util.Log.d("UserFilmActivityVM", "Posting ${diaryList.size} diaries and ${reviewList.size} reviews to LiveData")
                    
                    _diaries.postValue(diaryList)
                    _reviews.postValue(reviewList)
                } else {
                    android.util.Log.w("UserFilmActivityVM", "Response is null, posting empty lists")
                    _diaries.postValue(emptyList())
                    _reviews.postValue(emptyList())
                }
                
                _isLoading.postValue(false)
            } catch (e: Exception) {
                android.util.Log.e("UserFilmActivityVM", "Error loading activity: ${e.message}", e)
                _diaries.postValue(emptyList())
                _reviews.postValue(emptyList())
                _isLoading.postValue(false)
            }
        }
    }
}
