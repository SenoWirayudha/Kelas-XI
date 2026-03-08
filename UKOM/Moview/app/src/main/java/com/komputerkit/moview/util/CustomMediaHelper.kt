package com.komputerkit.moview.util

import com.komputerkit.moview.data.api.DisplayMediaEntry
import com.komputerkit.moview.data.model.Movie

private const val STORAGE_BASE_URL = "http://10.0.2.2:8000/storage/"

fun resolveMediaUrl(path: String?): String? {
    if (path.isNullOrBlank()) return null
    return if (path.startsWith("http")) path else "$STORAGE_BASE_URL$path"
}

fun List<Movie>.applyCustomMedia(batch: Map<Int, DisplayMediaEntry>): List<Movie> {
    if (batch.isEmpty()) return this
    return map { movie ->
        val entry = batch[movie.id] ?: return@map movie
        val customPoster = entry.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
        val customBackdrop = entry.backdrop?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
        if (customPoster == null && customBackdrop == null) movie
        else movie.copy(
            posterUrl = customPoster ?: movie.posterUrl,
            backdropUrl = customBackdrop ?: movie.backdropUrl
        )
    }
}
