package com.komputerkit.moview.ui.search

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.TmdbImageUrl
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.isActive
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
    val isSelectMovieMode: Boolean = false,
    /** True while the next page of the movie grid is loading. */
    val isLoadingMoreMovies: Boolean = false
)

@OptIn(FlowPreview::class)
class SearchViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()
    
    private var searchJob: Job? = null
    private var loadMoreMoviesJob: Job? = null
    private var moviesPage = 1
    private var moviesLastPage = 1
    private var lastLoadedQuery: String? = null
    private var lastLoadedFilter: SearchFilter? = null

    var savedScrollY: Int = 0
    
    fun setSelectMovieMode(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(isSelectMovieMode = enabled)
    }
    
    fun setFilter(filter: SearchFilter) {
        _uiState.value = _uiState.value.copy(activeFilter = filter)
        // A new filter starts the movie grid from page 1 again.
        moviesPage = 1
        moviesLastPage = 1
        _uiState.value = _uiState.value.copy(isLoadingMoreMovies = false)
        loadMoreMoviesJob?.cancel()

        // Re-perform search with new filter if query exists
        val currentQuery = _uiState.value.query
        if (currentQuery.isBlank()) return
        // Lewati bila query+filter ini sudah berhasil dimuat
        if (lastLoadedQuery != null && currentQuery.trim() == lastLoadedQuery && lastLoadedFilter == filter) return
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            performSearch(currentQuery)
        }
    }

    fun onQueryChanged(query: String) {
        // Guard: lewati bila query+filter yang sama sudah berhasil dimuat
        if (lastLoadedQuery != null &&
            query.trim() == lastLoadedQuery &&
            _uiState.value.activeFilter == lastLoadedFilter
        ) {
            if (_uiState.value.query != query) {
                _uiState.value = _uiState.value.copy(query = query)
            }
            return
        }

        // Cancel previous search
        searchJob?.cancel()
        loadMoreMoviesJob?.cancel()
        // A new query starts the movie grid from page 1 again.
        moviesPage = 1
        moviesLastPage = 1
        _uiState.value = _uiState.value.copy(isLoadingMoreMovies = false)
        
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
            searchJob = viewModelScope.launch {
                performSearch(query)
            }
        }
    }
    
    private suspend fun performSearch(query: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)

        try {
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

            lastLoadedQuery = query.trim()
            lastLoadedFilter = filter
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
        } finally {
            // Reset isLoading hanya bila tidak ada pencarian pengganti yang menunggu
            if (searchJob?.isActive != true && _uiState.value.isLoading) {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
    
    private suspend fun searchMovies(query: String): List<Movie> = withContext(Dispatchers.Default) {
        try {
            val response = repository.search(query, "movies", page = 1)
            moviesPage = response?.movies_pagination?.current_page ?: 1
            moviesLastPage = response?.movies_pagination?.last_page ?: 1
            val movies = response?.movies?.map { dto -> mapMovie(dto) }
                ?: return@withContext emptyList()
            val userId = prefs.getInt("userId", 0)
            if (userId > 0 && movies.isNotEmpty()) {
                val customMedia = repository.batchCustomMedia(userId, movies.map { it.id }, "films")
                movies.applyCustomMedia(customMedia)
            } else movies
        } catch (e: CancellationException) {
            throw e
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
        } catch (e: CancellationException) {
            throw e
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
        } catch (e: CancellationException) {
            throw e
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
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    fun clearSearch() {
        searchJob?.cancel()
        loadMoreMoviesJob?.cancel()
        val current = _uiState.value
        // Forget the last successful query so retyping it searches again.
        lastLoadedQuery = null
        lastLoadedFilter = null
        moviesPage = 1
        moviesLastPage = 1
        // Clearing text must not drop the picker mode: without it the filter
        // chips panel reappears and the Cancel affordance disappears.
        _uiState.value = SearchUiState(
            activeFilter = current.activeFilter,
            isSelectMovieMode = current.isSelectMovieMode
        )
    }

    /**
     * Next page of the movie grid. Ignored while a search is running, while a
     * page is already loading, or when the results are exhausted.
     */
    fun loadMoreMovies() {
        val state = _uiState.value
        if (state.isLoading || state.isLoadingMoreMovies) return
        if (loadMoreMoviesJob?.isActive == true) return
        if (moviesPage >= moviesLastPage) return
        if (state.activeFilter != SearchFilter.ALL && state.activeFilter != SearchFilter.MOVIES) return
        val query = state.query.trim()
        if (query.isEmpty()) return

        loadMoreMoviesJob = viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingMoreMovies = true)
            try {
                val response = repository.search(query, "movies", page = moviesPage + 1)
                val newMovies = response?.movies?.map { dto -> mapMovie(dto) } ?: emptyList()
                if (newMovies.isEmpty()) {
                    moviesLastPage = moviesPage
                    return@launch
                }
                moviesPage = response?.movies_pagination?.current_page ?: (moviesPage + 1)
                moviesLastPage = response?.movies_pagination?.last_page ?: moviesLastPage

                val userId = prefs.getInt("userId", 0)
                val decorated = if (userId > 0) {
                    val customMedia = repository.batchCustomMedia(userId, newMovies.map { it.id }, "films")
                    newMovies.applyCustomMedia(customMedia)
                } else newMovies

                // Ignore the page if the query/filter changed while loading.
                val current = _uiState.value
                if (current.query.trim() != query) return@launch

                _uiState.value = current.copy(
                    movieResults = current.movieResults + decorated,
                    isLoadingMoreMovies = false
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoadingMoreMovies = false)
            }
        }
    }

    private fun mapMovie(dto: com.komputerkit.moview.data.api.MovieCardDto): Movie = Movie(
        id = dto.id,
        title = dto.title,
        posterUrl = dto.poster_path,
        averageRating = dto.average_rating,
        genre = dto.genres?.firstOrNull(),
        releaseYear = dto.year,
        description = null,
        backdropUrl = dto.backdrop_path,
        duration = dto.duration,
        pgRating = dto.rating,
        watchedCount = "${dto.watched_count} views"
    )
}
