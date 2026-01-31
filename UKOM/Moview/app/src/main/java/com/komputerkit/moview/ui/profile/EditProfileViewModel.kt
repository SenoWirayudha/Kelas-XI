package com.komputerkit.moview.ui.profile

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.UpdateFavoritesRequest
import com.komputerkit.moview.data.api.UpdateProfileRequest
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EditProfileUiState(
    val username: String = "",
    val bio: String = "",
    val location: String = "",
    val backdropEnabled: Boolean = false,
    val backdropUrl: String? = null,
    val favoriteSlots: List<FavoriteSlot> = List(4) { FavoriteSlot(it, null) },
    val isLoading: Boolean = false
)

class EditProfileViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
    private val _uiState = MutableStateFlow(EditProfileUiState())
    val uiState: StateFlow<EditProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadProfile()
    }
    
    private fun loadProfile() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        _uiState.value = _uiState.value.copy(isLoading = true)
        
        viewModelScope.launch {
            try {
                // Get profile with favorites
                val profileResponse = repository.getUserProfile(userId)
                if (profileResponse == null) {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    return@launch
                }
                
                // Convert favorites to slots (4 slots total)
                val favoriteSlots = (0..3).map { index ->
                    val favorite = profileResponse.favorites.find { it.position == index + 1 }
                    if (favorite != null) {
                        val movie = Movie(
                            id = favorite.id,
                            title = favorite.title,
                            posterUrl = favorite.poster_path ?: "",
                            backdropUrl = favorite.backdrop_path ?: "",
                            averageRating = 0f,
                            genre = "",
                            releaseYear = favorite.year,
                            description = ""
                        )
                        FavoriteSlot(index, movie)
                    } else {
                        FavoriteSlot(index, null)
                    }
                }
                
                _uiState.value = EditProfileUiState(
                    username = profileResponse.user.username,
                    bio = profileResponse.profile.bio,
                    location = profileResponse.profile.location,
                    backdropEnabled = profileResponse.profile.backdrop_enabled,
                    backdropUrl = profileResponse.profile.backdrop_url,
                    favoriteSlots = favoriteSlots,
                    isLoading = false
                )
            } catch (e: Exception) {
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
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
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                // Fetch full movie details from API
                val movieDetail = repository.getMovieDetail(movieId)
                
                if (movieDetail != null) {
                    // Add movie to favorites with full details (poster, backdrop, etc)
                    addFavoriteMovie(index, movieDetail)
                    
                    // Check if this is the first favorite
                    val updatedSlots = _uiState.value.favoriteSlots
                    val favoriteCount = updatedSlots.count { it.movie != null }
                    val isFirstFavorite = favoriteCount == 1
                    
                    // If this is the first favorite, auto-enable backdrop and set URL
                    if (isFirstFavorite && !movieDetail.backdropUrl.isNullOrEmpty()) {
                        _uiState.value = _uiState.value.copy(
                            backdropUrl = movieDetail.backdropUrl,
                            backdropEnabled = true  // Auto-enable backdrop
                        )
                    } else if (index == 0 && !movieDetail.backdropUrl.isNullOrEmpty()) {
                        // If updating position 1 (first slot), update backdrop URL
                        _uiState.value = _uiState.value.copy(
                            backdropUrl = movieDetail.backdropUrl
                        )
                    }
                } else {
                    // Fallback to placeholder if API fails
                    val movie = Movie(
                        id = movieId,
                        title = "Movie $movieId",
                        posterUrl = "",
                        backdropUrl = "",
                        averageRating = 0f,
                        genre = "",
                        releaseYear = 2024,
                        description = ""
                    )
                    addFavoriteMovie(index, movie)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
    
    fun removeFavoriteMovie(index: Int) {
        if (index !in 0..3) return
        
        val updatedSlots = _uiState.value.favoriteSlots.toMutableList()
        updatedSlots[index] = FavoriteSlot(index, null)
        
        // Check if there are any favorites left
        val hasFavoritesLeft = updatedSlots.any { it.movie != null }
        
        // If no favorites left, clear backdrop
        val updatedBackdropUrl = if (hasFavoritesLeft) _uiState.value.backdropUrl else null
        val updatedBackdropEnabled = if (hasFavoritesLeft) _uiState.value.backdropEnabled else false
        
        _uiState.value = _uiState.value.copy(
            favoriteSlots = updatedSlots,
            backdropUrl = updatedBackdropUrl,
            backdropEnabled = updatedBackdropEnabled
        )
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
    
    fun updateBackdropEnabled(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(backdropEnabled = enabled)
    }
    
    suspend fun saveProfile(): Boolean {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return false
        
        return try {
            val state = _uiState.value
            
            // Update profile (username, bio, location, backdrop_enabled)
            val profileRequest = UpdateProfileRequest(
                username = state.username,
                bio = state.bio,
                location = state.location,
                backdrop_enabled = state.backdropEnabled
            )
            repository.updateUserProfile(userId, profileRequest)
            
            // Update favorites
            val favoriteIds = state.favoriteSlots.map { it.movie?.id }
            val favoritesRequest = UpdateFavoritesRequest(favorites = favoriteIds)
            repository.updateUserFavorites(userId, favoritesRequest)
            
            // If backdrop is enabled and there's a backdrop URL in state, save it
            if (state.backdropEnabled && !state.backdropUrl.isNullOrEmpty()) {
                repository.updateUserBackdrop(userId, state.backdropUrl)
            }
            
            // Update SharedPreferences username
            prefs.edit().putString("username", state.username).apply()
            
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    fun uploadProfilePhoto(imageUri: android.net.Uri) {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val photoUrl = repository.uploadProfilePhoto(userId, imageUri, getApplication())
                if (photoUrl != null) {
                    // Save to SharedPreferences
                    prefs.edit().putString("profilePhotoUrl", photoUrl).apply()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
    
    fun setDefaultProfilePhoto() {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val success = repository.deleteProfilePhoto(userId)
                if (success) {
                    // Clear from SharedPreferences
                    prefs.edit().remove("profilePhotoUrl").apply()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
    
    fun updateBackdrop(backdropPath: String) {
        val userId = prefs.getInt("userId", 0)
        if (userId == 0) return
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val success = repository.updateUserBackdrop(userId, backdropPath)
                if (success) {
                    // Update state immediately with new backdrop URL
                    _uiState.value = _uiState.value.copy(
                        backdropUrl = backdropPath,
                        backdropEnabled = true
                    )
                    // Don't reload profile here to avoid overriding unsaved favorites
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
}
