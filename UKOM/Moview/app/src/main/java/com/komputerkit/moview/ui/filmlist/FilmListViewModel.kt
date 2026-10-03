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
    val error: String? = null
)

class FilmListViewModel : ViewModel() {

    private val repository = MovieRepository()

    private val _uiState = MutableStateFlow(FilmListUiState())
    val uiState: StateFlow<FilmListUiState> = _uiState.asStateFlow()

    private var loadedKey: String? = null
    private var loadJob: Job? = null
    private var refreshJob: Job? = null
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
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _uiState.value = FilmListUiState(
                categoryType = categoryType,
                categoryValue = categoryValue,
                status = FilmListStatus.LOADING,
                filterOptions = options ?: FilterOptionsDto()
            )
            try {
                val items = fetch(categoryType, categoryValue, userId)
                _uiState.value = _uiState.value.copy(
                    status = FilmListStatus.READY,
                    items = items,
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
        if (loadedKey == null) return

        refreshJob = viewModelScope.launch {
            _uiState.value = state.copy(status = FilmListStatus.REFRESHING)
            try {
                val items = fetch(state.categoryType, state.categoryValue, userId)
                _uiState.value = state.copy(
                    status = FilmListStatus.READY,
                    items = items,
                    error = null
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.value = state.copy(status = FilmListStatus.READY)
            }
        }
    }

    private suspend fun fetch(categoryType: String, categoryValue: String, userId: Int): List<Movie> {
        val raw = repository.getFilmsByCategory(categoryType, categoryValue)
        val items = if (userId > 0 && raw.isNotEmpty()) {
            val customMedia = repository.batchCustomMedia(userId, raw.map { it.id }, "films")
            raw.applyCustomMedia(customMedia)
        } else {
            raw
        }
        if (options == null) {
            options = repository.getFilterOptions()
            _uiState.value = _uiState.value.copy(filterOptions = options ?: FilterOptionsDto())
        }
        return items
    }
}
