package com.komputerkit.moview.ui.diary

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class DiaryViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    private var loadedKey: String? = null
    private var loadJob: Job? = null
    private var refreshJob: Job? = null
    
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

        val key = "diary|$targetUserId"
        if (loadJob?.isActive == true) return
        if (key == loadedKey && _diaryItems.value != null) {
            if (refreshJob?.isActive == true) return
            refreshJob = viewModelScope.launch {
                try {
                    fetchDiary(targetUserId)
                    loadedKey = key
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    android.util.Log.e("DiaryViewModel", "Silent refresh failed: ${e.message}", e)
                }
            }
            return
        }
        loadJob = viewModelScope.launch {
            _isLoading.value = true
            try {
                fetchDiary(targetUserId)
                loadedKey = key
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("DiaryViewModel", "Error loading diary: ${e.message}", e)
                _diaryItems.postValue(emptyList())
            } finally {
                if (isActive) _isLoading.postValue(false)
            }
        }
    }

    private suspend fun fetchDiary(targetUserId: Int) {
        android.util.Log.d("DiaryViewModel", "Fetching diary entries from API...")
        val entries = repository.getUserDiary(targetUserId)
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
    }
}
