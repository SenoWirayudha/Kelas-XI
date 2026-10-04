package com.komputerkit.moview.ui.filmlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.FilterOptionsDto
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class FilmListStatus {
    LOADING,
    READY,
    REFRESHING,
    ERROR
}

data class FilmListUiState(
    val categoryType: String = "",
    val categoryValue: String = "",
    val status: FilmListStatus = FilmListStatus.LOADING,
    val items: List<Movie> = emptyList(),
    val filterOptions: FilterOptionsDto = FilterOptionsDto(),
    val error: String? = null,
    val isLoadingMore: Boolean = false
)

class FilmListViewModel : ViewModel() {

    private val repository = MovieRepository()

    private val _uiState = MutableStateFlow(FilmListUiState())
    val uiState: StateFlow<FilmListUiState> = _uiState.asStateFlow()

    private var loadedKey: String? = null
    private var loadJob: Job? = null
    private var refreshJob: Job? = null
    private var loadMoreJob: Job? = null
    private var currentPage = 1
    private var lastPage = 1
    private var options: FilterOptionsDto? = null

    fun load(categoryType: String, categoryValue: String, userId: Int) {
        val key = "$categoryType|$categoryValue"
        if (key == loadedKey) {
            if (_uiState.value.status == FilmListStatus.READY) return
            if (loadJob?.isActive == true) return
            if (refreshJob?.isActive == true) return
        }

        loadedKey = key
        refreshJob?.cancel()
        loadMoreJob?.cancel()
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _uiState.value = FilmListUiState(
                categoryType = categoryType,
                categoryValue = categoryValue,
                status = FilmListStatus.LOADING,
                filterOptions = options ?: FilterOptionsDto()
            )
            try {
                val slice = fetch(categoryType, categoryValue, userId)
                _uiState.value = _uiState.value.copy(
                    status = FilmListStatus.READY,
                    items = slice.items,
                    error = null
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    status = FilmListStatus.ERROR,
                    error = e.message
                )
            }
        }
    }

    fun silentRefresh(userId: Int) {
        val state = _uiState.value
        if (userId <= 0) return
        if (state.status != FilmListStatus.READY) return
        if (refreshJob?.isActive == true) return
        if (loadMoreJob?.isActive == true) return
        if (loadedKey == null) return

        refreshJob = viewModelScope.launch {
            _uiState.value = state.copy(status = FilmListStatus.REFRESHING, isLoadingMore = false)
            try {
                val slice = fetch(state.categoryType, state.categoryValue, userId)
                _uiState.value = _uiState.value.copy(
                    status = FilmListStatus.READY,
                    items = slice.items,
                    error = null,
                    isLoadingMore = false
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(status = FilmListStatus.READY, isLoadingMore = false)
            }
        }
    }

    /**
     * Tarik halaman berikutnya saat mendekati akhir daftar (prefetch).
     * Data lama tetap di layar; kosong / error -> berhenti senyap.
     */
    fun loadMore(userId: Int) {
        val state = _uiState.value
        if (state.status != FilmListStatus.READY) return
        if (state.isLoadingMore) return
        if (loadJob?.isActive == true || refreshJob?.isActive == true || loadMoreJob?.isActive == true) return
        if (currentPage >= lastPage) return
        val categoryType = state.categoryType
        val categoryValue = state.categoryValue

        loadMoreJob = viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingMore = true)
            try {
                val slice = repository.getFilmsByCategoryPaged(categoryType, categoryValue, currentPage + 1)
                val current = _uiState.value
                if (current.categoryType != categoryType || current.categoryValue != categoryValue) {
                    return@launch
                }
                if (slice.items.isEmpty()) {
                    lastPage = currentPage
                    _uiState.value = current.copy(isLoadingMore = false)
                    return@launch
                }
                val newItems = if (userId > 0) {
                    val customMedia = repository.batchCustomMedia(userId, slice.items.map { it.id }, "films")
                    slice.items.applyCustomMedia(customMedia)
                } else {
                    slice.items
                }
                currentPage = slice.page
                lastPage = slice.lastPage
                _uiState.value = current.copy(
                    items = current.items + newItems,
                    isLoadingMore = false
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoadingMore = false)
            }
        }
    }

    private suspend fun fetch(categoryType: String, categoryValue: String, userId: Int): com.komputerkit.moview.data.repository.PagedSlice<Movie> {
        val slice = repository.getFilmsByCategoryPaged(categoryType, categoryValue, 1)
        currentPage = slice.page
        lastPage = slice.lastPage
        val items = if (userId > 0 && slice.items.isNotEmpty()) {
            val customMedia = repository.batchCustomMedia(userId, slice.items.map { it.id }, "films")
            slice.items.applyCustomMedia(customMedia)
        } else {
            slice.items
        }
        if (options == null) {
            options = repository.getFilterOptions()
            _uiState.value = _uiState.value.copy(filterOptions = options ?: FilterOptionsDto())
        }
        return slice.copy(items = items)
    }
}
