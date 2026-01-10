package com.komputerkit.moview.ui.profile

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository

class ProfileViewModel : ViewModel() {
    
    private val repository = MovieRepository()
    
    private val _favoriteMovies = MutableLiveData<List<Movie>>()
    val favoriteMovies: LiveData<List<Movie>> = _favoriteMovies
    
    private val _recentActivity = MutableLiveData<List<Pair<Movie, Float>>>()
    val recentActivity: LiveData<List<Pair<Movie, Float>>> = _recentActivity
    
    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> = _userName
    
    private val _bio = MutableLiveData<String>()
    val bio: LiveData<String> = _bio
    
    private val _location = MutableLiveData<String>()
    val location: LiveData<String> = _location
    
    private val _stats = MutableLiveData<UserStats>()
    val stats: LiveData<UserStats> = _stats
    
    init {
        loadProfileData()
    }
    
    private fun loadProfileData() {
        _userName.value = "Alex Cinephile"
        _bio.value = "Sci-fi addict. Nolan enthusiast.\nProfessional popcorn eater."
        _location.value = "JAKARTA, ID"
        
        // Favorites - ambil 4 film pertama
        _favoriteMovies.value = repository.getPopularMoviesThisWeek().take(4)
        
        // Recent Activity - film dengan rating
        val movies = repository.getPopularMoviesThisWeek()
        _recentActivity.value = listOf(
            Pair(movies[0], 5.0f),
            Pair(movies[2], 4.5f),
            Pair(movies[5], 4.0f),
            Pair(movies[1], 4.5f)
        )
        
        // Stats
        _stats.value = UserStats(
            films = 1240,
            diary = 823,
            reviews = 412,
            watchlist = 58,
            lists = 12,
            likes = 2400,
            followers = 890,
            following = 340,
            totalRatings = 842,
            rating5 = 70,
            rating4 = 85,
            rating3 = 45,
            rating2 = 20,
            rating1 = 10
        )
    }
}

data class UserStats(
    val films: Int,
    val diary: Int,
    val reviews: Int,
    val watchlist: Int,
    val lists: Int,
    val likes: Int,
    val followers: Int,
    val following: Int,
    val totalRatings: Int,
    val rating5: Int,
    val rating4: Int,
    val rating3: Int,
    val rating2: Int,
    val rating1: Int
)
