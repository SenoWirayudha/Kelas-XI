package com.komputerkit.moview.ui.artwork

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Artwork
import com.komputerkit.moview.data.model.ArtworkType
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.SetItemMediaRequest
import com.komputerkit.moview.data.api.SetListBackdropRequest
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.ServerConfig
import kotlinx.coroutines.launch

class PosterBackdropViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = MovieRepository()
    private val api = RetrofitClient.movieApiService
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
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

    private val _saveResult = MutableLiveData<Boolean?>()
    val saveResult: LiveData<Boolean?> = _saveResult
    
    fun loadMovie(
        movieId: Int,
        contextType: String = "films",
        diariesId: Int? = null,
        favoriteId: Int? = null,
        listId: Int = 0
    ) {
        val userId = prefs.getInt("userId", 0)
        viewModelScope.launch {
            _isLoading.value = true

            // Load movie details
            val movieDetail = repository.getMovieDetail(movieId)
            if (movieDetail != null) {
                _movie.value = movieDetail
            }

            // In list mode the only valid source is the list's own artwork; the
            // user's film/review customisation must never leak in.
            var savedCtxPosterId: Int? = null
            var savedCtxBackdropId: Int? = null
            var savedFilmsPosterId: Int? = null
            var savedFilmsBackdropId: Int? = null
            var ctxBadge: String? = contextTypeBadge(contextType)

            if (listId > 0) {
                ctxBadge = "LIST"
                val listResponse = runCatching { api.getFilmList(listId, userId) }.getOrNull()
                val list = listResponse?.data
                val item = list?.items?.firstOrNull { it.movie_id == movieId }
                savedCtxPosterId = item?.poster_media_id
                savedCtxBackdropId = list?.backdrop_media_id
            } else {
                val savedCtx = if (userId > 0) {
                    repository.getCustomMedia(userId, movieId, contextType, diariesId, favoriteId)
                } else emptyMap()
                val savedFilms = if (userId > 0 && contextType != "films") {
                    repository.getCustomMedia(userId, movieId, "films")
                } else savedCtx

                savedCtxPosterId     = savedCtx["poster"]?.media_id
                savedCtxBackdropId   = savedCtx["backdrop"]?.media_id
                savedFilmsPosterId   = savedFilms["poster"]?.media_id
                savedFilmsBackdropId = savedFilms["backdrop"]?.media_id
            }

            // Load media from API
            val media = repository.getMovieMedia(movieId)
            if (media != null) {
                _posters.value = media.posters.map { item ->
                    val url = ServerConfig.resolveStorageUrl(item.file_path)
                    val badges = buildList {
                        if (ctxBadge != null && item.id == savedCtxPosterId) add(ctxBadge)
                        if (listId <= 0 && contextType != "films" && item.id == savedFilmsPosterId) add("FILM")
                        if (isEmpty() && item.is_default) add("DEFAULT")
                    }
                    Artwork(
                        id = item.id,
                        type = ArtworkType.POSTER,
                        url = url,
                        label = "",
                        width = 0,
                        height = 0,
                        isSelected = item.id == (savedCtxPosterId ?: if (item.is_default) item.id else -1),
                        isDefault = item.is_default,
                        badgeLabels = badges
                    )
                }

                _backdrops.value = media.backdrops.map { item ->
                    val url = ServerConfig.resolveStorageUrl(item.file_path)
                    val badges = buildList {
                        if (ctxBadge != null && item.id == savedCtxBackdropId) add(ctxBadge)
                        if (listId <= 0 && contextType != "films" && item.id == savedFilmsBackdropId) add("FILM")
                        if (isEmpty() && item.is_default) add("DEFAULT")
                    }
                    Artwork(
                        id = item.id,
                        type = ArtworkType.BACKDROP,
                        url = url,
                        label = "",
                        width = 0,
                        height = 0,
                        isSelected = item.id == (savedCtxBackdropId ?: if (item.is_default) item.id else -1),
                        isDefault = item.is_default,
                        badgeLabels = badges
                    )
                }

                _selectedArtwork.value = _posters.value?.firstOrNull { it.isSelected }
            }

            _isLoading.value = false
        }
    }
    
    fun selectArtwork(artwork: Artwork) {
        _selectedArtwork.value = artwork
        
        // Update selection state; preserve badge labels
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
    
    fun saveArtwork(movieId: Int, type: String = "films", diariesId: Int? = null, favoriteId: Int? = null) {
        val userId = prefs.getInt("userId", 0)
        val artwork = _selectedArtwork.value
        if (userId <= 0 || artwork == null) {
            _saveResult.value = false
            return
        }
        viewModelScope.launch {
            val success = if (type == "profile") {
                // Profile backdrop saves directly to user_profiles.backdrop_path
                repository.updateUserBackdrop(userId, artwork.url)
            } else {
                repository.saveChangeMedia(
                    userId = userId,
                    filmId = movieId,
                    mediaId = artwork.id,
                    type = type,
                    diariesId = diariesId,
                    favoriteId = favoriteId
                )
            }
            _saveResult.value = success
        }
    }

    /**
     * Saves artwork for a film inside a list. Poster and backdrop are stored on
     * the list (list item / list hero), never on the film or review context.
     */
    fun saveListArtwork(listId: Int, movieId: Int, artwork: Artwork) {
        val userId = prefs.getInt("userId", 0)
        if (userId <= 0 || listId <= 0) {
            _saveResult.value = false
            return
        }

        viewModelScope.launch {
            val success = runCatching {
                if (artwork.type == ArtworkType.BACKDROP) {
                    api.setFilmListBackdrop(
                        userId,
                        listId,
                        SetListBackdropRequest(backdrop_media_id = artwork.id)
                    ).success
                } else {
                    // Only the poster field is sent; the item's backdrop is untouched.
                    api.setFilmListItemMedia(
                        userId,
                        listId,
                        movieId,
                        SetItemMediaRequest(poster_media_id = artwork.id)
                    ).success
                }
            }.getOrDefault(false)

            _saveResult.value = success
        }
    }

    fun clearSaveResult() {
        _saveResult.value = null
    }
}

private fun contextTypeBadge(type: String): String? = when (type) {
    "films"     -> "FILM"
    "reviews"   -> "REVIEW"
    "logged"    -> "LOG"
    "favorites" -> "FAVORITE"
    "profile"   -> "PROFILE"
    else        -> null
}
