package com.komputerkit.newsnow.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.newsnow.data.model.Article
import com.komputerkit.newsnow.data.repository.NewsRepository
import com.komputerkit.newsnow.utils.Resource
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NewsViewModel : ViewModel() {
    
    private val repository = NewsRepository()
    
    // Job untuk cancel search yang sedang berjalan
    private var searchJob: Job? = null
    private var newsJob: Job? = null
    
    // UI State untuk berita utama
    private val _topHeadlines = MutableStateFlow<Resource<List<Article>>>(Resource.Loading())
    val topHeadlines: StateFlow<Resource<List<Article>>> = _topHeadlines.asStateFlow()
    
    // UI State untuk hasil pencarian
    private val _searchResults = MutableStateFlow<Resource<List<Article>>>(Resource.Loading())
    val searchResults: StateFlow<Resource<List<Article>>> = _searchResults.asStateFlow()
    
    // UI State untuk kategori yang dipilih
    private val _selectedCategory = MutableStateFlow<String?>(null)
    val selectedCategory: StateFlow<String?> = _selectedCategory.asStateFlow()
    
    // UI State untuk mode pencarian
    private val _isSearchMode = MutableStateFlow(false)
    val isSearchMode: StateFlow<Boolean> = _isSearchMode.asStateFlow()
    
    // UI State untuk query pencarian
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    // Kategori yang tersedia
    val categories = listOf(
        "general" to "General",
        "business" to "Business", 
        "entertainment" to "Entertainment",
        "health" to "Health",
        "science" to "Science",
        "sports" to "Sports",
        "technology" to "Technology"
    )
    
    init {
        getTopHeadlines()
    }
    
    fun getTopHeadlines(category: String? = null) {
        // Cancel previous job untuk prevent duplicate requests
        newsJob?.cancel()
        
        newsJob = viewModelScope.launch {
            _topHeadlines.value = Resource.Loading()
            try {
                _topHeadlines.value = repository.getTopHeadlines(category)
            } catch (e: CancellationException) {
                // Job cancelled, do nothing
            } catch (e: Exception) {
                _topHeadlines.value = Resource.Error(e.message ?: "Unknown error occurred")
            }
        }
    }
    
    fun searchNews(query: String) {
        if (query.isBlank()) {
            _isSearchMode.value = false
            searchJob?.cancel()
            return
        }
        
        _isSearchMode.value = true
        _searchQuery.value = query
        
        // Cancel previous search job jika ada
        searchJob?.cancel()
        
        searchJob = viewModelScope.launch {
            _searchResults.value = Resource.Loading()
            
            try {
                // Debouncing - tunggu 500ms sebelum search
                delay(500L)
                
                val result = repository.searchNews(query)
                _searchResults.value = result
            } catch (e: CancellationException) {
                // Job cancelled by user, do nothing
            } catch (e: Exception) {
                _searchResults.value = Resource.Error("Search failed: ${e.message}")
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // Cancel all jobs when ViewModel is cleared
        searchJob?.cancel()
        newsJob?.cancel()
    }
    
    fun selectCategory(category: String?) {
        _selectedCategory.value = category
        getTopHeadlines(category)
    }
    
    fun toggleSearchMode() {
        _isSearchMode.value = !_isSearchMode.value
        if (!_isSearchMode.value) {
            _searchQuery.value = ""
        }
    }
    
    fun clearSearch() {
        _isSearchMode.value = false
        _searchQuery.value = ""
    }
}