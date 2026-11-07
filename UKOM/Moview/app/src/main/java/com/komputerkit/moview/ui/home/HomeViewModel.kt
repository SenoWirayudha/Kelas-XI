package com.komputerkit.moview.ui.home

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.data.model.TheatricalMovie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.ServerConfig
import com.komputerkit.moview.util.applyCustomMedia
import com.komputerkit.moview.util.resolveMediaUrl
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private var userId: Int = 0
    private var retryCount = 0
    private val maxRetries = 2
    
    init {
        android.util.Log.d("HomeViewModel", "Initialized")
    }
    
    private val _popularMovies = MutableLiveData<List<Movie>>()
    val popularMovies: LiveData<List<Movie>> = _popularMovies
    
    private val _friendActivities = MutableLiveData<List<FriendActivity>>()
    val friendActivities: LiveData<List<FriendActivity>> = _friendActivities

    private val _nowShowingMovies = MutableLiveData<List<TheatricalMovie>>()
    val nowShowingMovies: LiveData<List<TheatricalMovie>> = _nowShowingMovies

    private val _upcomingMovies = MutableLiveData<List<TheatricalMovie>>()
    val upcomingMovies: LiveData<List<TheatricalMovie>> = _upcomingMovies

    private val _comingSoonMovies = MutableLiveData<List<TheatricalMovie>>()
    val comingSoonMovies: LiveData<List<TheatricalMovie>> = _comingSoonMovies

    private val _events = MutableLiveData<List<com.komputerkit.moview.data.model.EventItem>>()
    val events: LiveData<List<com.komputerkit.moview.data.model.EventItem>> = _events

    private val _popularReviews = MutableLiveData<List<Review>>()
    val popularReviews: LiveData<List<Review>> = _popularReviews

    private val _popularWithFriends = MutableLiveData<List<Movie>>()
    val popularWithFriends: LiveData<List<Movie>> = _popularWithFriends

    private val _filmInterest = MutableLiveData<List<Movie>>()
    val filmInterest: LiveData<List<Movie>> = _filmInterest

    private val _reviewsLoaded = MutableLiveData(false)
    val reviewsLoaded: LiveData<Boolean> = _reviewsLoaded

    private var reviewsPage = 0
    private var reviewsLastPage = 1
    private var reviewsLoading = false

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    var savedScrollY: Int = 0

    fun setUserId(id: Int) {
        android.util.Log.d("HomeViewModel", "Setting userId: $id")
        userId = id
        // Only load if data hasn't been fetched yet; on back-navigation the ViewModel
        // survives so we preserve the cached data (and scroll position).
        if (_popularMovies.value.isNullOrEmpty()) {
            loadData()
        }
        if (_events.value == null) {
            loadEvents()
        }
        if (_popularWithFriends.value == null && _filmInterest.value == null) {
            loadSocialSections()
        }
    }
    
    private fun loadData() {
        viewModelScope.launch {
            try {
                android.util.Log.d("HomeViewModel", "Loading data for userId: $userId (attempt ${retryCount + 1})")
                _isLoading.value = true
                _error.value = null
                
                // Load data dari API
                val movies = repository.getPopularMoviesThisWeek()
                android.util.Log.d("HomeViewModel", "Loaded ${movies.size} popular movies")
                
                val activities = if (userId > 0) {
                    android.util.Log.d("HomeViewModel", "Fetching friend activities for user $userId")
                    val result = repository.getFriendsActivity(userId)
                    android.util.Log.d("HomeViewModel", "Received ${result.size} friend activities")
                    result
                } else {
                    android.util.Log.w("HomeViewModel", "User ID is 0, not fetching friend activities")
                    emptyList()
                }
                
                val nowShowing = repository.getNowShowingMovies(limit = 10)
                val upcoming = repository.getUpcomingMovies()
                val comingSoon = repository.getComingSoonMovies()

                // Apply custom media (films-type) for the current user's personalizations
                val theatricalIds = (nowShowing.map { it.id } + upcoming.map { it.id } + comingSoon.map { it.id }).distinct()
                val allFilmIds = (movies.map { it.id } + theatricalIds).distinct()
                val customMedia = if (userId > 0 && allFilmIds.isNotEmpty()) {
                    repository.batchCustomMedia(userId, allFilmIds, "films")
                } else emptyMap()

                _popularMovies.value = movies.applyCustomMedia(customMedia)
                _friendActivities.value = activities
                _nowShowingMovies.value = nowShowing.map { movie ->
                    val entry = customMedia[movie.id] ?: return@map movie
                    val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                    if (customPoster != null) movie.copy(posterUrl = customPoster) else movie
                }
                _upcomingMovies.value = upcoming.map { movie ->
                    val entry = customMedia[movie.id] ?: return@map movie
                    val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                    if (customPoster != null) movie.copy(posterUrl = customPoster) else movie
                }
                _comingSoonMovies.value = comingSoon.map { movie ->
                    val entry = customMedia[movie.id] ?: return@map movie
                    val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                    if (customPoster != null) movie.copy(posterUrl = customPoster) else movie
                }
                retryCount = 0
                android.util.Log.d("HomeViewModel", "Data loaded successfully")
                
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Error loading data (attempt ${retryCount + 1})", e)
                
                if (retryCount < maxRetries) {
                    retryCount++
                    _isLoading.value = false
                    kotlinx.coroutines.delay(500)
                    loadData()
                    return@launch
                }
                
                _error.value = "Failed to load data: ${e.message}"
                retryCount = 0
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun refreshData() {
        loadData()
        loadEvents()
        loadSocialSections()
        if (_reviewsLoaded.value == true) loadPopularReviews(reset = true)
    }

    /** "Popular with Friends" + "Film Interest" (computed server-side). */
    fun loadSocialSections() {
        viewModelScope.launch {
            _popularWithFriends.postValue(repository.getPopularWithFriends(userId))
            _filmInterest.postValue(repository.getFilmInterest(userId))
        }
    }

    /** Festivals shown at the top of the Bioskop tab. */
    fun loadEvents() {
        viewModelScope.launch {
            _events.postValue(repository.getEvents())
        }
    }

    /** First load only: the Review tab is fetched when the user opens it. */
    fun ensurePopularReviews() {
        if (_reviewsLoaded.value != true && !reviewsLoading) loadPopularReviews(reset = true)
    }

    fun loadPopularReviews(reset: Boolean = false) {
        if (reviewsLoading) return
        if (!reset && _reviewsLoaded.value == true && reviewsPage >= reviewsLastPage) return

        val page = if (reset) 1 else reviewsPage + 1
        reviewsLoading = true
        viewModelScope.launch {
            val response = repository.getPopularReviews(page)
            if (response != null && response.success) {
                val mapped = response.data.orEmpty().map { it.toReview() }
                _popularReviews.value = if (reset) mapped else _popularReviews.value.orEmpty() + mapped
                reviewsPage = response.pagination?.current_page ?: page
                reviewsLastPage = response.pagination?.last_page ?: page
            }
            _reviewsLoaded.value = true
            reviewsLoading = false
        }
    }

    private fun com.komputerkit.moview.data.api.UserReviewDto.toReview(): Review {
        val watched = watched_at ?: created_at
        return Review(
            id = review_id,
            movie = Movie(
                id = id,
                title = title,
                posterUrl = ServerConfig.resolveStorageUrl(poster_path),
                averageRating = rating ?: 0f,
                genre = "",
                releaseYear = year.toIntOrNull() ?: 0,
                description = "",
                backdropUrl = backdrop_path?.takeIf { it.isNotBlank() }
                    ?.let { ServerConfig.resolveStorageUrl(it) }
            ),
            rating = rating ?: 0f,
            reviewText = content,
            reviewDate = watched,
            dateLabel = formatDateLabel(watched),
            userId = 0,
            movieId = id,
            isLiked = is_liked,
            isRewatch = is_rewatched,
            isSpoiler = is_spoiler,
            diaryId = diary_id
        )
    }

    private fun formatDateLabel(dateString: String): String {
        return try {
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = try {
                dateFormat.parse(dateString)
            } catch (e: Exception) {
                SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).parse(dateString)
            }
            if (date != null) {
                "Watched ${SimpleDateFormat("dd MMMM yyyy", Locale("id", "ID")).format(date)}"
            } else {
                "Watched recently"
            }
        } catch (e: Exception) {
            "Watched recently"
        }
    }
}
