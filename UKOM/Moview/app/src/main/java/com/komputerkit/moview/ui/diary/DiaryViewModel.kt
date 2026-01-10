package com.komputerkit.moview.ui.diary

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.data.repository.MovieRepository

class DiaryViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _diaryItems = MutableLiveData<List<DiaryItem>>()
    val diaryItems: LiveData<List<DiaryItem>> = _diaryItems
    
    init {
        loadDiaryEntries()
    }
    
    private fun loadDiaryEntries() {
        val entries = repository.getDiaryEntries()
        val items = mutableListOf<DiaryItem>()
        
        var currentMonth = ""
        entries.forEach { entry ->
            if (entry.monthYear != currentMonth) {
                currentMonth = entry.monthYear
                items.add(DiaryItem.Header(currentMonth))
            }
            items.add(DiaryItem.Entry(entry))
        }
        
        _diaryItems.value = items
    }
    
    fun toggleLike(entry: DiaryEntry) {
        // In real app, update repository
    }
}
