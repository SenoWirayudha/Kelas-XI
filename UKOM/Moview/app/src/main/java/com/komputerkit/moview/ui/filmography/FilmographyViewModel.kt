package com.komputerkit.moview.ui.filmography

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.ui.common.MovieFilterState
import com.komputerkit.moview.ui.common.MovieFilterUtils
import com.komputerkit.moview.ui.common.MovieSortMode
import com.komputerkit.moview.ui.common.RatingSource
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class FilmographyViewModel : ViewModel() {

    private val repository = MovieRepository()

    private val _films = MutableLiveData<List<Movie>>()
    val films: LiveData<List<Movie>> = _films

    private val _genres = MutableLiveData<List<String>>(emptyList())
    val genres: LiveData<List<String>> = _genres

    private val _countries = MutableLiveData<List<String>>(emptyList())
    val countries: LiveData<List<String>> = _countries

    private val _languages = MutableLiveData<List<String>>(emptyList())
    val languages: LiveData<List<String>> = _languages

    private var allFilms: List<Movie> = emptyList()
    private var filterState = MovieFilterState()

    fun loadFilmography(filterType: String, filterValue: String, userId: Int) {
        Log.i("FG", "loadFilmography userId=$userId type=$filterType value=$filterValue")
        if (userId == 0) {
            Log.e("FG", "userId=0 – cannot apply custom media!")
        }
        viewModelScope.launch {
            try {
                val rawFilms = repository.getFilmsByCategory(filterType, filterValue)
                Log.i("FG", "rawFilms count=${rawFilms.size}")
                rawFilms.take(3).forEach { Log.i("FG", "  BEFORE id=${it.id} poster=${it.posterUrl}") }

                if (userId > 0 && rawFilms.isNotEmpty()) {
                    val filmIds = rawFilms.map { it.id }
                    Log.i("FG", "calling batchCustomMedia userId=$userId ids=$filmIds")
                    val customMedia = repository.batchCustomMedia(userId, filmIds, "films")
                    Log.i("FG", "batchCustomMedia returned ${customMedia.size} entries")
                    customMedia.forEach { (id, entry) ->
                        Log.i("FG", "  [$id] is_default=${entry.poster?.is_default} path=${entry.poster?.path}")
                    }
                    val result = rawFilms.applyCustomMedia(customMedia)
                    result.take(3).forEach { Log.i("FG", "  AFTER id=${it.id} poster=${it.posterUrl}") }
                    allFilms = result
                } else {
                    allFilms = rawFilms
                }

                val options = repository.getFilterOptions()
                _genres.postValue(options.genres)
                _countries.postValue(options.countries)
                _languages.postValue(options.languages)
                _films.postValue(MovieFilterUtils.applyFilters(allFilms, filterState))
            } catch (e: Exception) {
                Log.e("FG", "Exception: ${e.message}", e)
                _films.postValue(emptyList())
            }
        }
    }

    private fun applyCurrentFilters() {
        _films.value = MovieFilterUtils.applyFilters(allFilms, filterState)
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
