package com.komputerkit.moview.ui.filmography

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository

class FilmographyViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _films = MutableLiveData<List<Movie>>()
    val films: LiveData<List<Movie>> = _films
    
    fun loadFilmography(filterType: String, filterValue: String) {
        // TODO: Implement actual filtering logic
        // For now, load all popular movies as placeholder
        _films.value = repository.getPopularMoviesThisWeek()
    }
}
