package com.komputerkit.moview.ui.profile

import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class EditProfileUiState(
    val username: String = "",
    val bio: String = "",
    val location: String = "",
    val favoriteSlots: List<FavoriteSlot> = List(4) { FavoriteSlot(it, null) }
)

class EditProfileViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _uiState = MutableStateFlow(EditProfileUiState())
    val uiState: StateFlow<EditProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadProfile()
    }
    
    private fun loadProfile() {
        // Load from repository or preferences
        _uiState.value = EditProfileUiState(
            username = "alexcinephile",
            bio = "Cinema lover. Sci-fi enthusiast. Always waiting for the next Christopher Nolan masterpiece.",
            location = "San Francisco, CA",
            favoriteSlots = createInitialFavorites()
        )
    }
    
    private fun createInitialFavorites(): List<FavoriteSlot> {
        // Get some sample favorite movies
        val movies = repository.getPopularMoviesThisWeek()
        return List(4) { index ->
            FavoriteSlot(
                index = index,
                movie = if (index < 3) movies.getOrNull(index) else null
            )
        }
    }
    
    fun addFavoriteMovie(index: Int, movie: Movie) {
        if (index !in 0..3) return
        
        val updatedSlots = _uiState.value.favoriteSlots.toMutableList()
        updatedSlots[index] = FavoriteSlot(index, movie)
        
        _uiState.value = _uiState.value.copy(favoriteSlots = updatedSlots)
    }
    
    fun addFavoriteMovieById(index: Int, movieId: Int) {
        if (index !in 0..3) return
        
        // Get movie from repository by ID
        val allMovies = repository.getPopularMoviesThisWeek()
        val movie = allMovies.find { it.id == movieId }
        
        if (movie != null) {
            addFavoriteMovie(index, movie)
        }
    }
    
    fun removeFavoriteMovie(index: Int) {
        if (index !in 0..3) return
        
        val updatedSlots = _uiState.value.favoriteSlots.toMutableList()
        updatedSlots[index] = FavoriteSlot(index, null)
        
        _uiState.value = _uiState.value.copy(favoriteSlots = updatedSlots)
    }
    
    fun updateUsername(username: String) {
        _uiState.value = _uiState.value.copy(username = username)
    }
    
    fun updateBio(bio: String) {
        _uiState.value = _uiState.value.copy(bio = bio)
    }
    
    fun updateLocation(location: String) {
        _uiState.value = _uiState.value.copy(location = location)
    }
    
    fun saveProfile() {
        // Save to repository or preferences
        // For now, just a placeholder
    }
}
