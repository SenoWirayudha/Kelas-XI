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
    private var loadMoreJob: Job? = null
    private var currentPage = 1
    private var lastPage = 1
    private var allEntries: List<DiaryEntry> = emptyList()
    
    private val _diaryItems = MutableLiveData<List<DiaryItem>>()
    val diaryItems: LiveData<List<DiaryItem>> = _diaryItems
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _isLoadingMore = MutableLiveData<Boolean>(false)
    val isLoadingMore: LiveData<Boolean> = _isLoadingMore
    
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
            if (loadMoreJob?.isActive == true) return
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
        refreshJob?.cancel()
        loadMoreJob?.cancel()
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
        val slice = repository.getUserDiaryPaged(targetUserId, 1)
        currentPage = slice.page
        lastPage = slice.lastPage
        allEntries = slice.items
        android.util.Log.d("DiaryViewModel", "Fetched ${allEntries.size} diary entries")
        _diaryItems.postValue(groupWithHeaders(allEntries))
    }

    /**
     * Gabung entry per bulan + header (dipakai load awal & setiap loadMore).
     */
    private fun groupWithHeaders(entries: List<DiaryEntry>): List<DiaryItem> {
        val items = mutableListOf<DiaryItem>()
        var currentMonth = ""
        entries.forEach { entry ->
            if (entry.monthYear != currentMonth) {
                currentMonth = entry.monthYear
                items.add(DiaryItem.Header(currentMonth))
            }
            items.add(DiaryItem.Entry(entry))
        }
        return items
    }

    /**
     * Infinite scroll: tarik halaman berikutnya, akumulasi entry, susun ulang header.
     */
    fun loadMore(userId: Int = 0) {
        val targetUserId = if (userId > 0) userId else prefs.getInt("userId", 0)
        if (targetUserId == 0) return
        if (loadJob?.isActive == true || refreshJob?.isActive == true || loadMoreJob?.isActive == true) return
        if (_isLoadingMore.value == true) return
        if (currentPage >= lastPage) return
        if (loadedKey != "diary|$targetUserId") return

        loadMoreJob = viewModelScope.launch {
            _isLoadingMore.postValue(true)
            try {
                val slice = repository.getUserDiaryPaged(targetUserId, currentPage + 1)
                if (slice.items.isEmpty()) {
                    lastPage = currentPage
                    return@launch
                }
                currentPage = slice.page
                lastPage = slice.lastPage
                allEntries = allEntries + slice.items
                _diaryItems.postValue(groupWithHeaders(allEntries))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("DiaryViewModel", "loadMore failed: ${e.message}", e)
            } finally {
                if (isActive) _isLoadingMore.postValue(false)
            }
        }
    }
}
