package com.komputerkit.moview.ui.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.TmdbImageUrl
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.launch

data class SearchUiState(
    val isLoading: Boolean = false,
    val query: String = "",
    val movieResults: List<Movie> = emptyList(),
    val personResults: List<SearchPerson> = emptyList(),
    val studioResults: List<SearchStudio> = emptyList(),
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
    
    fun onQueryChanged(query: String) {
        // Cancel previous search
        searchJob?.cancel()
        
        _uiState.value = _uiState.value.copy(query = query)
        
        if (query.isBlank()) {
            // Clear results when query is empty
            _uiState.value = SearchUiState(query = "")
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
            
            // Search movies
            val movies = searchMovies(query)
            
            // Search people
            val people = searchPeople(query)
            
            // Search studios
            val studios = searchStudios(query)
            
            val isEmpty = movies.isEmpty() && people.isEmpty() && studios.isEmpty()
            
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                movieResults = movies,
                personResults = people,
                studioResults = studios,
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
    
    private fun searchMovies(query: String): List<Movie> {
        // TODO: Replace with actual TMDB API call (/search/movie)
        // For now, filter local repository data
        return repository.getPopularMoviesThisWeek()
            .filter { it.title.contains(query, ignoreCase = true) }
            .take(6)
    }
    
    private fun searchPeople(query: String): List<SearchPerson> {
        // TODO: Replace with actual TMDB API call (/search/person)
        // Dummy data for now
        val allPeople = listOf(
            SearchPerson(
                id = 1,
                name = "Christopher Nolan",
                role = "Director",
                knownFor = "Known for The Dark Knight, Inception, Interstellar",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: ""
            ),
            SearchPerson(
                id = 2,
                name = "Leonardo DiCaprio",
                role = "Actor",
                knownFor = "Known for Inception, The Wolf of Wall Street, Titanic",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: ""
            ),
            SearchPerson(
                id = 3,
                name = "Hans Zimmer",
                role = "Composer",
                knownFor = "Known for The Dark Knight, Inception, Gladiator",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: ""
            ),
            SearchPerson(
                id = 4,
                name = "Martin Scorsese",
                role = "Director",
                knownFor = "Known for The Godfather, Goodfellas, The Irishman",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: ""
            ),
            SearchPerson(
                id = 5,
                name = "Quentin Tarantino",
                role = "Director",
                knownFor = "Known for Pulp Fiction, Django Unchained, Kill Bill",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: ""
            )
        )
        
        return allPeople
            .filter { it.name.contains(query, ignoreCase = true) }
            .take(6)
    }
    
    private fun searchStudios(query: String): List<SearchStudio> {
        // TODO: Replace with actual TMDB API call (/search/company)
        // Dummy data for now
        val allStudios = listOf(
            SearchStudio(1, "Warner Bros. Pictures"),
            SearchStudio(2, "Universal Pictures"),
            SearchStudio(3, "Paramount Pictures"),
            SearchStudio(4, "20th Century Studios"),
            SearchStudio(5, "Sony Pictures"),
            SearchStudio(6, "Walt Disney Pictures"),
            SearchStudio(7, "Columbia Pictures"),
            SearchStudio(8, "Legendary Pictures")
        )
        
        return allStudios
            .filter { it.name.contains(query, ignoreCase = true) }
            .take(6)
    }
    
    fun clearSearch() {
        searchJob?.cancel()
        _uiState.value = SearchUiState()
    }
}
