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
        loadDiary()
    }
    
    fun loadDiary() {
        loadDiaryEntries()
    }
    
    private fun loadDiaryEntries() {
        val userId = prefs.getInt("userId", 0)
        android.util.Log.d("DiaryViewModel", "Loading diary for userId: $userId")
        
        if (userId == 0) {
            android.util.Log.e("DiaryViewModel", "User ID is 0, not loading diary")
            _diaryItems.value = emptyList()
            return
        }
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                android.util.Log.d("DiaryViewModel", "Fetching diary entries from API...")
                val entries = repository.getUserDiary(userId)
                android.util.Log.d("DiaryViewModel", "Fetched ${entries.size} diary entries")
                
                // Group entries by month/year and create header items
                val items = mutableListOf<DiaryItem>()
                var currentMonth = ""
                entries.forEach { entry ->
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
