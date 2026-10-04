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
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class FilmographyViewModel : ViewModel() {

    private val repository = MovieRepository()

    private var loadedKey: String? = null
    private var loadJob: Job? = null
    private var refreshJob: Job? = null
    private var loadMoreJob: Job? = null
    private var currentPage = 1
    private var lastPage = 1

    private val _films = MutableLiveData<List<Movie>>()
    val films: LiveData<List<Movie>> = _films

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _isLoadingMore = MutableLiveData<Boolean>(false)
    val isLoadingMore: LiveData<Boolean> = _isLoadingMore

    private val _genres = MutableLiveData<List<String>>(emptyList())
    val genres: LiveData<List<String>> = _genres

    private val _countries = MutableLiveData<List<String>>(emptyList())
    val countries: LiveData<List<String>> = _countries

    private val _languages = MutableLiveData<List<String>>(emptyList())
    val languages: LiveData<List<String>> = _languages

    private val _themes = MutableLiveData<List<String>>(emptyList())
    val themes: LiveData<List<String>> = _themes

    private var allFilms: List<Movie> = emptyList()
    private var filterState = MovieFilterState(sortMode = MovieSortMode.POPULARITY)

    fun loadFilmography(filterType: String, filterValue: String, userId: Int) {
        Log.i("FG", "loadFilmography userId=$userId type=$filterType value=$filterValue")
        if (userId == 0) {
            Log.e("FG", "userId=0 – cannot apply custom media!")
        }
        val key = "filmography|$filterType|$filterValue|$userId"
        if (loadJob?.isActive == true) return
        if (key == loadedKey && _films.value != null) {
            if (refreshJob?.isActive == true) return
            if (loadMoreJob?.isActive == true) return
            refreshJob = viewModelScope.launch {
                try {
                    fetchFilmography(filterType, filterValue, userId)
                    loadedKey = key
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    Log.e("FG", "Silent refresh failed: ${e.message}", e)
                }
            }
            return
        }
        refreshJob?.cancel()
        loadMoreJob?.cancel()
        loadJob = viewModelScope.launch {
            _isLoading.value = true
            try {
                fetchFilmography(filterType, filterValue, userId)
                loadedKey = key
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e("FG", "Exception: ${e.message}", e)
                _films.postValue(emptyList())
            } finally {
                if (isActive) _isLoading.postValue(false)
            }
        }
    }

    private suspend fun fetchFilmography(filterType: String, filterValue: String, userId: Int) {
        val slice = repository.getFilmsByCategoryPaged(filterType, filterValue, 1)
        currentPage = slice.page
        lastPage = slice.lastPage
        val rawFilms = slice.items
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
        _themes.postValue(options.themes)
        _films.postValue(MovieFilterUtils.applyFilters(allFilms, filterState))
    }

    /**
     * Infinite scroll: tarik halaman berikutnya saat mendekati akhir,
     * akumulasi ke allFilms, lalu terapkan ulang filter/sort yang aktif.
     */
    fun loadMore(filterType: String, filterValue: String, userId: Int) {
        if (loadJob?.isActive == true || refreshJob?.isActive == true || loadMoreJob?.isActive == true) return
        if (_isLoadingMore.value == true) return
        if (currentPage >= lastPage) return
        if (loadedKey != "filmography|$filterType|$filterValue|$userId") return

        loadMoreJob = viewModelScope.launch {
            _isLoadingMore.postValue(true)
            try {
                val slice = repository.getFilmsByCategoryPaged(filterType, filterValue, currentPage + 1)
                if (slice.items.isEmpty()) {
                    lastPage = currentPage
                    return@launch
                }
                val newItems = if (userId > 0 && slice.items.isNotEmpty()) {
                    slice.items.applyCustomMedia(
                        repository.batchCustomMedia(userId, slice.items.map { it.id }, "films")
                    )
                } else {
                    slice.items
                }
                currentPage = slice.page
                lastPage = slice.lastPage
                allFilms = allFilms + newItems
                applyCurrentFilters()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e("FG", "loadMore failed: ${e.message}", e)
            } finally {
                if (isActive) _isLoadingMore.postValue(false)
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

    fun currentGenre(): String? = filterState.selectedGenre
    fun currentCountry(): String? = filterState.selectedCountry
    fun currentLanguage(): String? = filterState.selectedLanguage
    fun currentTheme(): String? = filterState.selectedTheme
    fun currentYear(): Int? = filterState.selectedYear

    fun currentReleaseYearChoice(): String? = when {
        filterState.sortMode != MovieSortMode.RELEASE_YEAR -> null
        filterState.releaseYearDescending -> "Newest First"
        else -> "Earliest First"
    }

    fun currentRatingChoice(): String? {
        if (filterState.sortMode != MovieSortMode.RATING) return null
        return if (filterState.ratingDescending) {
            "Highest Rated: ${if (filterState.ratingSource == RatingSource.AVERAGE) "Average" else "Your"}"
        } else {
            "Lowest Rated: ${if (filterState.ratingSource == RatingSource.AVERAGE) "Average" else "Your"}"
        }
    }

    fun availableYears(): List<String> =
        allFilms.mapNotNull { it.releaseYear }.distinct().sortedDescending().map { it.toString() }

    fun setCountry(country: String?) {
        filterState = filterState.copy(selectedCountry = country)
        applyCurrentFilters()
    }

    fun setLanguage(language: String?) {
        filterState = filterState.copy(selectedLanguage = language)
        applyCurrentFilters()
    }

    fun setTheme(theme: String?) {
        filterState = filterState.copy(selectedTheme = theme)
        applyCurrentFilters()
    }
}
