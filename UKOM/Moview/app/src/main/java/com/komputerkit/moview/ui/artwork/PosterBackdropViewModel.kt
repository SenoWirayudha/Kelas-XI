package com.komputerkit.moview.ui.artwork

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.util.TmdbImageUrl
import com.komputerkit.moview.data.model.Artwork
import com.komputerkit.moview.data.model.ArtworkType
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository

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
    
    fun loadMovie(movieId: Int) {
        val movies = repository.getPopularMoviesThisWeek()
        _movie.value = movies.find { it.id == movieId } ?: movies.first()
        
        loadArtwork()
    }
    
    private fun loadArtwork() {
        // Load sample posters
        _posters.value = listOf(
            Artwork(
                id = 1,
                type = ArtworkType.POSTER,
                url = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR) ?: "",
                label = "Original • 2000x3000",
                width = 2000,
                height = 3000,
                isSelected = true
            ),
            Artwork(
                id = 2,
                type = ArtworkType.POSTER,
                url = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNE) ?: "",
                label = "Variant A • 1500x2200",
                width = 1500,
                height = 2200
            ),
            Artwork(
                id = 3,
                type = ArtworkType.POSTER,
                url = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT) ?: "",
                label = "Retro • 1200x1800",
                width = 1200,
                height = 1800
            ),
            Artwork(
                id = 4,
                type = ArtworkType.POSTER,
                url = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION) ?: "",
                label = "Teaser • 2000x3000",
                width = 2000,
                height = 3000
            ),
            Artwork(
                id = 5,
                type = ArtworkType.POSTER,
                url = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNKIRK) ?: "",
                label = "Int'l • 1080x1600",
                width = 1080,
                height = 1600
            ),
            Artwork(
                id = 6,
                type = ArtworkType.POSTER,
                url = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_BATMAN_BEGINS) ?: "",
                label = "Special Ed. • 4000x6000",
                width = 4000,
                height = 6000
            )
        )
        
        // Load sample backdrops
        _backdrops.value = listOf(
            Artwork(
                id = 11,
                type = ArtworkType.BACKDROP,
                url = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT) ?: "",
                label = "Original • 1920x1080",
                width = 1920,
                height = 1080
            ),
            Artwork(
                id = 12,
                type = ArtworkType.BACKDROP,
                url = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT) ?: "",
                label = "4K • 3840x2160",
                width = 3840,
                height = 2160
            ),
            Artwork(
                id = 13,
                type = ArtworkType.BACKDROP,
                url = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT) ?: "",
                label = "Widescreen • 1920x800",
                width = 1920,
                height = 800
            )
        )
        
        _selectedArtwork.value = _posters.value?.first()
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
