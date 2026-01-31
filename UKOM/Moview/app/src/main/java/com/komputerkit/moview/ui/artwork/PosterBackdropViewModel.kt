package com.komputerkit.moview.ui.artwork

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Artwork
import com.komputerkit.moview.data.model.ArtworkType
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

class PosterBackdropViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie
    
    private val _posters = MutableLiveData<List<Artwork>>()
    val posters: LiveData<List<Artwork>> = _posters
    
    private val _backdrops = MutableLiveData<List<Artwork>>()
    val backdrops: LiveData<List<Artwork>> = _backdrops
    
    private val _selectedArtwork = MutableLiveData<Artwork?>()
    val selectedArtwork: LiveData<Artwork?> = _selectedArtwork
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    fun loadMovie(movieId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            
            // Load movie details
            val movieDetail = repository.getMovieDetail(movieId)
            if (movieDetail != null) {
                _movie.value = movieDetail
            }
            
            // Load media from API
            val media = repository.getMovieMedia(movieId)
            if (media != null) {
                _posters.value = media.posters.mapIndexed { index, item ->
                    val url = when {
                        item.file_path.isNullOrBlank() -> ""
                        item.file_path.startsWith("http") -> item.file_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${item.file_path}"
                    }
                    Artwork(
                        id = item.id,
                        type = ArtworkType.POSTER,
                        url = url,
                        label = "",
                        width = 0,
                        height = 0,
                        isSelected = item.is_default
                    )
                }
                
                _backdrops.value = media.backdrops.mapIndexed { index, item ->
                    val url = when {
                        item.file_path.isNullOrBlank() -> ""
                        item.file_path.startsWith("http") -> item.file_path.replace("127.0.0.1", "10.0.2.2")
                        else -> "http://10.0.2.2:8000/storage/${item.file_path}"
                    }
                    Artwork(
                        id = item.id,
                        type = ArtworkType.BACKDROP,
                        url = url,
                        label = "",
                        width = 0,
                        height = 0,
                        isSelected = item.is_default
                    )
                }
                
                _selectedArtwork.value = _posters.value?.firstOrNull { it.isSelected }
            }
            
            _isLoading.value = false
        }
    }
    
    fun selectArtwork(artwork: Artwork) {
        _selectedArtwork.value = artwork
        
        // Update selection state
        if (artwork.type == ArtworkType.POSTER) {
            _posters.value = _posters.value?.map {
                it.copy(isSelected = it.id == artwork.id)
            }
        } else {
            _backdrops.value = _backdrops.value?.map {
                it.copy(isSelected = it.id == artwork.id)
            }
        }
    }
    
    fun saveArtwork(): Boolean {
        // In a real app, save to repository
        return true
    }
}
