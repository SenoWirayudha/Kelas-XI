package com.komputerkit.moview.ui.films

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class FilmsViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _films = MutableLiveData<List<Movie>>()
    val films: LiveData<List<Movie>> = _films
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private var allFilms: List<Movie> = emptyList()
    
    init {
        loadFilms()
    }
    
    fun loadFilms() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                allFilms = repository.getUserFilms(userId)
                Log.d("FilmsViewModel", "Loaded ${allFilms.size} films")
                allFilms.forEach { film ->
                    Log.d("FilmsViewModel", "Film: ${film.title}, isLiked=${film.isLiked}, rating=${film.userRating}")
                }
                _films.postValue(allFilms)
            } catch (e: Exception) {
                e.printStackTrace()
                _films.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    fun sortByDateWatched() {
        _films.value = allFilms.reversed()
    }
    
    fun sortByHighestRated() {
        _films.value = allFilms.sortedByDescending { it.userRating }
    }
    
    fun filterByGenre() {
        // TODO: Implement genre filtering
        _films.value = allFilms
    }
}
