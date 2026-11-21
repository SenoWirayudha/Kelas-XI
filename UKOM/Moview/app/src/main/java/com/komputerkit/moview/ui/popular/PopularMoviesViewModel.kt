package com.komputerkit.moview.ui.popular

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class PopularMoviesViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    private var loadJob: Job? = null
    private var loadMoreJob: Job? = null
    private var currentPage = 1
    private var lastPage = 1

    private val _movies = MutableLiveData<List<Movie>>()
    val movies: LiveData<List<Movie>> = _movies

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _isLoadingMore = MutableLiveData<Boolean>(false)
    val isLoadingMore: LiveData<Boolean> = _isLoadingMore

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun loadPopularMovies(force: Boolean = false) {
        if (loadJob?.isActive == true) return
        // Keep the loaded pages on re-entry (e.g. back from a film detail).
        if (!force && _movies.value != null) return
        loadJob = viewModelScope.launch {
            _loading.value = true
            try {
                _error.value = null
                val slice = repository.getPopularMoviesThisWeekPaged(1)
                currentPage = slice.page
                lastPage = slice.lastPage
                _movies.value = applyCustomMedia(slice.items)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _error.value = "Failed to load movies: ${e.message}"
                _movies.value = emptyList()
            } finally {
                if (isActive) _loading.value = false
            }
        }
    }

    /** Next page; ignored while loading or when the data is exhausted. */
    fun loadMore() {
        if (loadJob?.isActive == true || loadMoreJob?.isActive == true) return
        if (_isLoadingMore.value == true) return
        if (currentPage >= lastPage) return

        loadMoreJob = viewModelScope.launch {
            _isLoadingMore.value = true
            try {
                val slice = repository.getPopularMoviesThisWeekPaged(currentPage + 1)
                if (slice.items.isEmpty()) {
                    lastPage = currentPage
                    return@launch
                }
                currentPage = slice.page
                lastPage = slice.lastPage
                _movies.value = (_movies.value ?: emptyList()) + applyCustomMedia(slice.items)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                if (isActive) _isLoadingMore.value = false
            }
        }
    }

    private suspend fun applyCustomMedia(items: List<Movie>): List<Movie> {
        val userId = prefs.getInt("userId", 0)
        if (userId <= 0 || items.isEmpty()) return items
        val customMedia = repository.batchCustomMedia(userId, items.map { it.id }, "films")
        return items.applyCustomMedia(customMedia)
    }
}
