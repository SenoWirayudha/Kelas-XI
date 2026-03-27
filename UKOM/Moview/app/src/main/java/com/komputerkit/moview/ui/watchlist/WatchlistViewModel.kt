package com.komputerkit.moview.ui.watchlist

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.ui.common.MovieFilterState
import com.komputerkit.moview.ui.common.MovieFilterUtils
import com.komputerkit.moview.ui.common.MovieSortMode
import com.komputerkit.moview.ui.common.RatingSource
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class WatchlistViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _watchlistItems = MutableLiveData<List<WatchlistItem>>()
    val watchlistItems: LiveData<List<WatchlistItem>> = _watchlistItems
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _genres = MutableLiveData<List<String>>(emptyList())
    val genres: LiveData<List<String>> = _genres

    private val _countries = MutableLiveData<List<String>>(emptyList())
    val countries: LiveData<List<String>> = _countries

    private val _languages = MutableLiveData<List<String>>(emptyList())
    val languages: LiveData<List<String>> = _languages
    
    private var allItems: List<WatchlistItem> = emptyList()
    private var allMovies: List<Movie> = emptyList()
    private var filterState = MovieFilterState()
    
    fun loadWatchlist(userId: Int) {
        if (userId == 0) return
        
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val rawMovies = repository.getUserWatchlist(userId)
                val customMedia = repository.batchCustomMedia(userId, rawMovies.map { it.id }, "films")
                val movies = rawMovies.applyCustomMedia(customMedia)
                allMovies = movies
                allItems = movies.map { movie ->
                    WatchlistItem(
                        id = movie.id,
                        movie = movie,
                        addedDate = movie.activityAtRaw ?: "",
                        isWatched = false
                    )
                }
                val options = repository.getFilterOptions()
                _genres.postValue(options.genres)
                _countries.postValue(options.countries)
                _languages.postValue(options.languages)
                applyCurrentFilters()
            } catch (e: Exception) {
                e.printStackTrace()
                _watchlistItems.postValue(emptyList())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    private fun applyCurrentFilters() {
        val filteredMovies = MovieFilterUtils.applyFilters(allMovies, filterState)
        _watchlistItems.value = filteredMovies.map { movie ->
            allItems.find { it.movie.id == movie.id }
                ?: WatchlistItem(
                    id = movie.id,
                    movie = movie,
                    addedDate = movie.activityAtRaw ?: "",
                    isWatched = false
                )
        }
    }
    
    fun sortByDateAdded() {
        filterState = filterState.copy(sortMode = MovieSortMode.DATE)
        applyCurrentFilters()
    }
    
    fun sortByReleaseYear(descending: Boolean) {
        filterState = filterState.copy(
            sortMode = MovieSortMode.RELEASE_YEAR,
            releaseYearDescending = descending
        )
        applyCurrentFilters()
    }

    fun sortByHighestRated(source: RatingSource) {
        filterState = filterState.copy(
            sortMode = MovieSortMode.RATING,
            ratingSource = source,
            ratingDescending = true
        )
        applyCurrentFilters()
    }

    fun sortByLowestRated(source: RatingSource) {
        filterState = filterState.copy(
            sortMode = MovieSortMode.RATING,
            ratingSource = source,
            ratingDescending = false
        )
        applyCurrentFilters()
    }

    fun setYear(year: Int?) {
        filterState = filterState.copy(selectedYear = year)
        applyCurrentFilters()
    }

    fun setGenre(genre: String?) {
        filterState = filterState.copy(selectedGenre = genre)
        applyCurrentFilters()
    }

    fun setCountry(country: String?) {
        filterState = filterState.copy(selectedCountry = country)
        applyCurrentFilters()
    }

    fun setLanguage(language: String?) {
        filterState = filterState.copy(selectedLanguage = language)
        applyCurrentFilters()
    }
}
