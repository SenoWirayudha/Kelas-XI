package com.komputerkit.moview.ui.lists

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.AddListItemsRequest
import com.komputerkit.moview.data.api.CreateFilmListRequest
import com.komputerkit.moview.data.api.FilmListDto
import com.komputerkit.moview.data.api.FilmListItemDto
import com.komputerkit.moview.data.api.MovieApiService
import com.komputerkit.moview.data.api.ReorderListRequest
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.SetItemMediaRequest
import com.komputerkit.moview.data.api.UpdateFilmListRequest
import com.komputerkit.moview.data.model.ArtworkOption
import com.komputerkit.moview.data.model.FilmBackdropOption
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.data.model.MovieArtwork
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.ServerConfig
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

/**
 * Shared state for the four list screens. The discount-free API layer is dumb:
 * every rule (duplicates, ranking, visibility) is enforced server-side.
 */
class FilmListViewModel(application: Application) : AndroidViewModel(application) {

    private val api: MovieApiService = RetrofitClient.movieApiService
    private val repository = MovieRepository()
    private val prefs = application.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)

    val currentUserId: Int get() = prefs.getInt("userId", 0)

    private val _lists = MutableLiveData<List<FilmList>>(emptyList())
    val lists: LiveData<List<FilmList>> = _lists

    private val _list = MutableLiveData<FilmList?>(null)
    val list: LiveData<FilmList?> = _list

    private val _error = MutableLiveData<String?>(null)
    val error: LiveData<String?> = _error

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _isSaving = MutableLiveData(false)
    val isSaving: LiveData<Boolean> = _isSaving

    private val _saved = MutableLiveData(false)
    val saved: LiveData<Boolean> = _saved

    private val _artwork = MutableLiveData<MovieArtwork?>(null)
    val artwork: LiveData<MovieArtwork?> = _artwork

    private val _backdropMovies = MutableLiveData<List<FilmBackdropOption>>(emptyList())
    val backdropMovies: LiveData<List<FilmBackdropOption>> = _backdropMovies

    // ---- Lists overview -------------------------------------------------

    fun loadMyLists() {
        val userId = currentUserId
        if (userId <= 0) {
            _lists.value = emptyList()
            return
        }

        _isLoading.value = true
        viewModelScope.launch {
            try {
                val response = api.getUserLists(userId, userId)
                _lists.postValue(response.data.orEmpty().map { it.toModel() })
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isLoading.postValue(false)
            }
        }
    }

    fun loadListsOf(userId: Int) {
        if (userId <= 0) {
            _lists.value = emptyList()
            return
        }

        _isLoading.value = true
        viewModelScope.launch {
            try {
                val response = api.getUserLists(userId, currentUserId)
                _lists.postValue(response.data.orEmpty().map { it.toModel() })
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isLoading.postValue(false)
            }
        }
    }

    fun deleteList(listId: Int) {
        val userId = currentUserId
        viewModelScope.launch {
            try {
                api.deleteFilmList(userId, listId)
                _lists.postValue(_lists.value.orEmpty().filterNot { it.id == listId })
                _saved.postValue(true)
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            }
        }
    }

    // ---- Editor ---------------------------------------------------------

    /** Loads the list into `list` so the editor can prefill its fields. */
    fun loadList(listId: Int) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val response = api.getFilmList(listId, currentUserId)
                _list.postValue(response.data?.toModel())
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isLoading.postValue(false)
            }
        }
    }

    fun saveList(
        listId: Int?,
        title: String,
        description: String?,
        type: String,
        visibility: String,
        useBackdrop: Boolean = false
    ) {
        if (title.isBlank()) {
            _error.value = "Judul list wajib diisi."
            return
        }

        val userId = currentUserId
        _isSaving.value = true
        viewModelScope.launch {
            try {
                val response = if (listId == null || listId <= 0) {
                    api.createFilmList(
                        userId,
                        CreateFilmListRequest(title.trim(), description?.takeIf { it.isNotBlank() }, type, visibility)
                    )
                } else {
                    api.updateFilmList(
                        userId,
                        listId,
                        UpdateFilmListRequest(title.trim(), description?.takeIf { it.isNotBlank() }, type, visibility, useBackdrop)
                    )
                }

                if (response.success) {
                    response.data?.let { _list.postValue(it.toModel()) }
                    _saved.postValue(true)
                } else {
                    _error.postValue(response.message ?: "Gagal menyimpan list.")
                }
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isSaving.postValue(false)
            }
        }
    }

    fun clearSaved() {
        _saved.value = false
    }

    // ---- Detail ---------------------------------------------------------

    fun loadDetail(listId: Int) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val response = api.getFilmList(listId, currentUserId)
                _list.postValue(response.data?.toModel())
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isLoading.postValue(false)
            }
        }
    }

    fun addFilms(listId: Int, movieIds: List<Int>) {
        if (movieIds.isEmpty()) return
        _isSaving.value = true
        viewModelScope.launch {
            try {
                val response = api.addFilmListItems(currentUserId, listId, AddListItemsRequest(movieIds))
                response.data?.let { _list.postValue(it.toModel()) }
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isSaving.postValue(false)
            }
        }
    }

    fun removeFilm(listId: Int, movieId: Int) {
        viewModelScope.launch {
            try {
                val response = api.removeFilmListItem(currentUserId, listId, movieId)
                response.data?.let { _list.postValue(it.toModel()) }
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            }
        }
    }

    /** Persists a drag result; the UI already shows the new order optimistically. */
    fun reorder(listId: Int, ordered: List<FilmListItem>) {
        _list.postValue(_list.value?.copy(items = ordered))

        viewModelScope.launch {
            try {
                api.reorderFilmList(currentUserId, listId, ReorderListRequest(ordered.map { it.movieId }))
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
                // Resync from the server so the UI cannot drift from the truth.
                loadDetail(listId)
            }
        }
    }

    fun toggleBackdrop(listId: Int, enabled: Boolean) {
        val current = _list.value ?: return
        _list.value = current.copy(useBackdrop = enabled)

        viewModelScope.launch {
            try {
                val response = api.updateFilmList(
                    currentUserId,
                    listId,
                    UpdateFilmListRequest(
                        title = current.title,
                        description = current.description,
                        type = current.type,
                        visibility = current.visibility,
                        use_backdrop = enabled
                    )
                )
                response.data?.let { _list.postValue(it.toModel()) }
            } catch (e: Exception) {
                _list.postValue(current)
                _error.postValue(messageOf(e))
            }
        }
    }

    // ---- Artwork --------------------------------------------------------

    fun loadArtwork(listId: Int) {
        viewModelScope.launch {
            try {
                val response = api.getListBackdropMovies(listId, currentUserId)
                _backdropMovies.postValue(
                    response.data.orEmpty().map { dto ->
                        FilmBackdropOption(
                            movieId = dto.movie_id,
                            title = dto.title,
                            backdrops = dto.backdrops.map { ArtworkOption(it.id, ServerConfig.fixUrl(it.url)) }
                        )
                    }
                )
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            }
        }
    }

    fun loadMovieArtwork(movieId: Int) {
        _artwork.value = null
        viewModelScope.launch {
            try {
                val response = api.getMovieArtwork(movieId)
                response.data?.let { dto ->
                    _artwork.postValue(
                        MovieArtwork(
                            posters = dto.posters.map { ArtworkOption(it.id, ServerConfig.fixUrl(it.url)) },
                            backdrops = dto.backdrops.map { ArtworkOption(it.id, ServerConfig.fixUrl(it.url)) }
                        )
                    )
                }
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            }
        }
    }

    /** Null clears the choice and restores the film's default artwork. */
    fun setItemMedia(listId: Int, movieId: Int, posterMediaId: Int?, backdropMediaId: Int?) {
        _isSaving.value = true
        viewModelScope.launch {
            try {
                val response = api.setFilmListItemMedia(
                    currentUserId,
                    listId,
                    movieId,
                    SetItemMediaRequest(posterMediaId, backdropMediaId)
                )
                response.data?.let { _list.postValue(it.toModel()) }
            } catch (e: Exception) {
                _error.postValue(messageOf(e))
            } finally {
                _isSaving.postValue(false)
            }
        }
    }

    /** Search for the film picker (reuses the global search endpoint). */
    suspend fun searchMovies(query: String): List<Movie> {
        val response = repository.search(query, "movies") ?: return emptyList()
        return response.movies.orEmpty().map { dto ->
            Movie(
                id = dto.id,
                title = dto.title,
                posterUrl = dto.poster_path?.let { ServerConfig.fixUrl(it) },
                averageRating = dto.average_rating ?: 0f,
                genre = dto.genres?.joinToString(", ") ?: "",
                releaseYear = dto.year,
                description = ""
            )
        }
    }

    fun clearError() {
        _error.value = null
    }

    private fun messageOf(e: Exception): String {
        if (e is HttpException) {
            val raw = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
            if (!raw.isNullOrBlank()) {
                val parsed = runCatching { JSONObject(raw).optString("message") }.getOrNull()
                if (!parsed.isNullOrBlank()) return parsed
                return raw
            }
            return e.message()
        }
        return e.message ?: "Terjadi kesalahan jaringan."
    }

    private fun FilmListDto.toModel() = FilmList(
        id = id,
        userId = user_id,
        title = title,
        description = description,
        type = type,
        visibility = visibility,
        useBackdrop = use_backdrop,
        itemsCount = items_count,
        posterUrl = poster_url?.let { ServerConfig.fixUrl(it) },
        backdropUrl = backdrop_url?.let { ServerConfig.fixUrl(it) },
        items = items.map { it.toModel() }
    )

    private fun FilmListItemDto.toModel() = FilmListItem(
        movieId = movie_id,
        position = position,
        title = title,
        releaseYear = release_year,
        ageRating = age_rating,
        posterUrl = poster_url?.let { ServerConfig.fixUrl(it) },
        backdropUrl = backdrop_url?.let { ServerConfig.fixUrl(it) },
        customPoster = custom_poster,
        customBackdrop = custom_backdrop,
        posterMediaId = poster_media_id,
        backdropMediaId = backdrop_media_id
    )
}
