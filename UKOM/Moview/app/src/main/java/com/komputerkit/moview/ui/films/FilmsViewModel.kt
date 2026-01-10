package com.komputerkit.moview.ui.films

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository

class FilmsViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _films = MutableLiveData<List<Movie>>()
    val films: LiveData<List<Movie>> = _films
    
    init {
        loadFilms()
    }
    
    private fun loadFilms() {
        _films.value = repository.getMovies()
    }
    
    fun sortByDateWatched() {
        _films.value = repository.getMovies().reversed()
    }
    
    fun sortByHighestRated() {
        _films.value = repository.getMovies().sortedByDescending { it.averageRating }
    }
    
    fun filterByGenre() {
        _films.value = repository.getMovies()
    }
}
