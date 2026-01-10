package com.komputerkit.moview.ui.search

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.TmdbImageUrl

class SearchViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _movies = MutableLiveData<List<Movie>>()
    val movies: LiveData<List<Movie>> = _movies
    
    private val _people = MutableLiveData<List<SearchPerson>>()
    val people: LiveData<List<SearchPerson>> = _people
    
    private val _studios = MutableLiveData<List<SearchStudio>>()
    val studios: LiveData<List<SearchStudio>> = _studios
    
    init {
        loadSearchResults()
    }
    
    private fun loadSearchResults() {
        // Get movies from repository
        _movies.value = repository.getPopularMoviesThisWeek().take(3)
        
        // Dummy people data
        _people.value = listOf(
            SearchPerson(
                id = 1,
                name = "Christopher Nolan",
                role = "Director",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: ""
            ),
            SearchPerson(
                id = 2,
                name = "Leonardo DiCaprio",
                role = "Actor",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: ""
            ),
            SearchPerson(
                id = 3,
                name = "Hans Zimmer",
                role = "Composer",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: ""
            )
        )
        
        // Dummy studios data
        _studios.value = listOf(
            SearchStudio(1, "Warner Bros"),
            SearchStudio(2, "Universal Pictures"),
            SearchStudio(3, "Paramount"),
            SearchStudio(4, "20th Century"),
            SearchStudio(5, "Sony Pictures")
        )
    }
    
    fun search(query: String) {
        // TODO: Implement search filter
    }
}
