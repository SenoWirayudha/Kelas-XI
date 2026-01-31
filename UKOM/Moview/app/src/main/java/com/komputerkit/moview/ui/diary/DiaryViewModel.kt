package com.komputerkit.moview.ui.diary

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class DiaryViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _diaryItems = MutableLiveData<List<DiaryItem>>()
    val diaryItems: LiveData<List<DiaryItem>> = _diaryItems
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    init {
        loadDiaryEntries()
    }
    
    private fun loadDiaryEntries() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val movies = repository.getUserDiary(userId)
                val entries = movies.map { movie ->
                    DiaryEntry(
                        id = movie.id,
                        movie = movie,
                        watchedDate = "Recently",
                        dateLabel = "Recently",
                        monthYear = "Recent",
                        rating = movie.userRating.toInt(),
                        hasReview = false,
                        isLiked = false
                    )
                }
                
                val items = mutableListOf<DiaryItem>()
                var currentMonth = ""
                entries.forEach { entry ->
                    if (entry.monthYear != currentMonth) {
                        currentMonth = entry.monthYear
                        items.add(DiaryItem.Header(currentMonth))
                    }
                    items.add(DiaryItem.Entry(entry))
                }
                
                _diaryItems.postValue(items)
            } catch (e: Exception) {
                e.printStackTrace()
                _diaryItems.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
}
