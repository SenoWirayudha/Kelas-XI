package com.komputerkit.moview.ui.filmography

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class FilmographyViewModel : ViewModel() {

    private val repository = MovieRepository()

    private val _films = MutableLiveData<List<Movie>>()
    val films: LiveData<List<Movie>> = _films

    fun loadFilmography(filterType: String, filterValue: String, userId: Int) {
        Log.i("FG", "loadFilmography userId=$userId type=$filterType value=$filterValue")
        if (userId == 0) {
            Log.e("FG", "userId=0 – cannot apply custom media!")
        }
        viewModelScope.launch {
            try {
                val rawFilms = repository.getFilmsByCategory(filterType, filterValue)
                Log.i("FG", "rawFilms count=${rawFilms.size}")
                rawFilms.take(3).forEach { Log.i("FG", "  BEFORE id=${it.id} poster=${it.posterUrl}") }

                if (userId > 0 && rawFilms.isNotEmpty()) {
                    val filmIds = rawFilms.map { it.id }
                    Log.i("FG", "calling batchCustomMedia userId=$userId ids=$filmIds")
                    val customMedia = repository.batchCustomMedia(userId, filmIds, "films")
                    Log.i("FG", "batchCustomMedia returned ${customMedia.size} entries")
                    customMedia.forEach { (id, entry) ->
                        Log.i("FG", "  [$id] is_default=${entry.poster?.is_default} path=${entry.poster?.path}")
                    }
                    val result = rawFilms.applyCustomMedia(customMedia)
                    result.take(3).forEach { Log.i("FG", "  AFTER id=${it.id} poster=${it.posterUrl}") }
                    _films.postValue(result)
                } else {
                    _films.postValue(rawFilms)
                }
            } catch (e: Exception) {
                Log.e("FG", "Exception: ${e.message}", e)
                _films.postValue(emptyList())
            }
        }
    }
}
