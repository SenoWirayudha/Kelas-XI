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
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class DiaryViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _diaryItems = MutableLiveData<List<DiaryItem>>()
    val diaryItems: LiveData<List<DiaryItem>> = _diaryItems
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    fun loadDiary(userId: Int = 0) {
        loadDiaryEntries(userId)
    }
    
    private fun loadDiaryEntries(userId: Int = 0) {
        val targetUserId = if (userId > 0) userId else prefs.getInt("userId", 0)
        android.util.Log.d("DiaryViewModel", "Loading diary for userId: $targetUserId")
        
        if (targetUserId == 0) {
            android.util.Log.e("DiaryViewModel", "User ID is 0, not loading diary")
            _diaryItems.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                android.util.Log.d("DiaryViewModel", "Fetching diary entries from API...")
                val entries = repository.getUserDiary(targetUserId)
                android.util.Log.d("DiaryViewModel", "Fetched ${entries.size} diary entries")
                
                // Apply custom media: use "logged" type for plain log entries, "reviews" type for reviewed entries
                val loggedIds = entries.filter { !it.hasReview }.map { it.movie.id }.distinct()
                val reviewIds = entries.filter { it.hasReview }.map { it.movie.id }.distinct()
                val loggedMedia = if (loggedIds.isNotEmpty()) repository.batchCustomMedia(targetUserId, loggedIds, "logged") else emptyMap()
                val reviewMedia = if (reviewIds.isNotEmpty()) repository.batchCustomMedia(targetUserId, reviewIds, "reviews") else emptyMap()
                val updatedEntries = entries.map { entry ->
                    val mediaMap = if (entry.hasReview) reviewMedia else loggedMedia
                    val custom = mediaMap[entry.movie.id] ?: return@map entry
                    val movies = listOf(entry.movie).applyCustomMedia(mapOf(entry.movie.id to custom))
                    entry.copy(movie = movies.first())
                }
                
                // Group entries by month/year and create header items
                val items = mutableListOf<DiaryItem>()
                var currentMonth = ""
                updatedEntries.forEach { entry ->
                    if (entry.monthYear != currentMonth) {
                        currentMonth = entry.monthYear
                        items.add(DiaryItem.Header(currentMonth))
                    }
                    items.add(DiaryItem.Entry(entry))
                }
                
                android.util.Log.d("DiaryViewModel", "Created ${items.size} diary items (including headers)")
                _diaryItems.postValue(items)
            } catch (e: Exception) {
                android.util.Log.e("DiaryViewModel", "Error loading diary: ${e.message}", e)
                _diaryItems.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
}
