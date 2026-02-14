package com.komputerkit.moview.ui.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.TmdbImageUrl
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class SearchFilter {
    ALL, MOVIES, CAST_CREW, PRODUCTION_HOUSES, PEOPLE
}

data class SearchUiState(
    val isLoading: Boolean = false,
    val query: String = "",
    val activeFilter: SearchFilter = SearchFilter.ALL,
    val movieResults: List<Movie> = emptyList(),
    val castCrewResults: List<SearchPerson> = emptyList(),
    val productionHouseResults: List<SearchStudio> = emptyList(),
    val userResults: List<SearchUser> = emptyList(),
    val error: String? = null,
    val isEmpty: Boolean = false,
    val isSelectMovieMode: Boolean = false
)

@OptIn(FlowPreview::class)
class SearchViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()
    
    private var searchJob: Job? = null
    
    fun setSelectMovieMode(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(isSelectMovieMode = enabled)
    }
    
    fun setFilter(filter: SearchFilter) {
        _uiState.value = _uiState.value.copy(activeFilter = filter)
        
        // Re-perform search with new filter if query exists
        val currentQuery = _uiState.value.query
        if (currentQuery.isNotBlank()) {
            viewModelScope.launch {
                performSearch(currentQuery)
            }
        }
    }
    
    fun onQueryChanged(query: String) {
        // Cancel previous search
        searchJob?.cancel()
        
        _uiState.value = _uiState.value.copy(query = query)
        
        if (query.isBlank()) {
            // Clear results when query is empty, but preserve filter and mode
            _uiState.value = _uiState.value.copy(
                query = "",
                movieResults = emptyList(),
                castCrewResults = emptyList(),
                productionHouseResults = emptyList(),
                userResults = emptyList(),
                isEmpty = false,
                error = null,
                isLoading = false
            )
            return
        }
        
        // Debounce search (500ms)
        searchJob = viewModelScope.launch {
            delay(500)
            performSearch(query)
        }
    }
    
    fun onSearchSubmit(query: String) {
        // Immediate search without debounce
        searchJob?.cancel()
        if (query.isNotBlank()) {
            viewModelScope.launch {
                performSearch(query)
            }
        }
    }
    
    private suspend fun performSearch(query: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        
        try {
            // Simulate API delay
            delay(300)
            
            val filter = _uiState.value.activeFilter
            
            // Search based on active filter
            val movies = if (filter == SearchFilter.ALL || filter == SearchFilter.MOVIES) {
                searchMovies(query)
            } else emptyList()
            
            val castCrew = if (filter == SearchFilter.ALL || filter == SearchFilter.CAST_CREW) {
                searchCastCrew(query)
            } else emptyList()
            
            val productionHouses = if (filter == SearchFilter.ALL || filter == SearchFilter.PRODUCTION_HOUSES) {
                searchProductionHouses(query)
            } else emptyList()
            
            val users = if (filter == SearchFilter.ALL || filter == SearchFilter.PEOPLE) {
                searchUsers(query)
            } else emptyList()
            
            val isEmpty = movies.isEmpty() && castCrew.isEmpty() && productionHouses.isEmpty() && users.isEmpty()
            
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                movieResults = movies,
                castCrewResults = castCrew,
                productionHouseResults = productionHouses,
                userResults = users,
                isEmpty = isEmpty
            )
        } catch (e: CancellationException) {
            // Coroutine was cancelled (user typed again or left screen)
            // Don't update UI state, just rethrow to properly cancel
            throw e
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                error = e.message ?: "Search failed"
            )
        }
    }
    
    private suspend fun searchMovies(query: String): List<Movie> = withContext(Dispatchers.Default) {
        try {
            val response = repository.search(query, "movies")
            response?.movies?.map { dto ->
                Movie(
                    id = dto.id,
                    title = dto.title,
                    posterUrl = dto.poster_path,
                    averageRating = dto.average_rating,
                    genre = dto.genres.firstOrNull(),
                    releaseYear = dto.year,
                    description = null,
                    backdropUrl = dto.backdrop_path,
                    duration = dto.duration,
                    pgRating = dto.rating,
                    watchedCount = "${dto.watched_count} views"
                )
            } ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    private suspend fun searchCastCrew(query: String): List<SearchPerson> = withContext(Dispatchers.Default) {
        try {
            val response = repository.search(query, "cast_crew")
            response?.cast_crew?.map { dto ->
                SearchPerson(
                    id = dto.id,
                    name = dto.name,
                    role = dto.role,
                    knownFor = dto.known_for,
                    avatarUrl = dto.avatar_url ?: ""
                )
            } ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    private suspend fun searchProductionHouses(query: String): List<SearchStudio> = withContext(Dispatchers.Default) {
        try {
            val response = repository.search(query, "production_houses")
            response?.production_houses?.map { dto ->
                SearchStudio(
                    id = dto.id,
                    name = dto.name
                )
            } ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    private suspend fun searchUsers(query: String): List<SearchUser> = withContext(Dispatchers.Default) {
        try {
            val response = repository.search(query, "people")
            response?.people?.map { dto ->
                SearchUser(
                    id = dto.id,
                    username = dto.username,
                    fullName = dto.full_name,
                    avatarUrl = dto.avatar_url ?: "",
                    filmsCount = dto.films_count,
                    reviewsCount = dto.reviews_count
                )
            } ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    fun clearSearch() {
        searchJob?.cancel()
        _uiState.value = SearchUiState(activeFilter = _uiState.value.activeFilter)
    }
}
