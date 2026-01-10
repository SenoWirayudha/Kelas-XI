package com.komputerkit.moview.ui.detail

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.CastMember
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.util.TmdbImageUrl
import com.komputerkit.moview.data.repository.MovieRepository

class MovieDetailViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movie = MutableLiveData<Movie>()
    val movie: LiveData<Movie> = _movie
    
    private val _streamingServices = MutableLiveData<List<String>>()
    val streamingServices: LiveData<List<String>> = _streamingServices
    
    fun loadMovieDetails(movieId: Int) {
        // Get movie from repository and update with detailed info
        val baseMovie = repository.getMovies().find { it.id == movieId }
        
        baseMovie?.let { movie ->
            // Add detailed information
            val detailedMovie = movie.copy(
                backdropUrl = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT) ?: "",
                director = "Christopher Nolan",
                duration = "2h 49m",
                pgRating = "PG-13",
                watchedCount = "12.4k",
                reviewCount = "3.4k",
                rating5 = 75,
                rating4 = 60,
                rating3 = 40,
                rating2 = 20,
                rating1 = 10,
                cast = listOf(
                    CastMember(1, "Matthew M.", "Cooper", TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: ""),
                    CastMember(2, "Jessica C.", "Murph", TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: ""),
                    CastMember(3, "Anne H.", "Brand", TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: ""),
                    CastMember(4, "Michael C.", "Prof. Brand", TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "")
                ),
                similarMovies = repository.getMovies().take(3)
            )
            
            _movie.value = detailedMovie
        }
        
        // Load streaming services
        _streamingServices.value = listOf("Netflix", "Prime", "YouTube", "MAX", "Disney+")
    }
}
