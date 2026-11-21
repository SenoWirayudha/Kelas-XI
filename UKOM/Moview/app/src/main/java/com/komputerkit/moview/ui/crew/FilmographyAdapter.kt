package com.komputerkit.moview.ui.crew

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.ui.common.FilmGridCell
import com.komputerkit.moview.ui.common.FilmGridSizes

class FilmographyAdapter(
    private val onFilmClick: (Film) -> Unit,
    private val onLogFilm: ((Film) -> Unit)? = null,
    private val onChangePoster: ((Film) -> Unit)? = null
) : ListAdapter<Film, FilmographyAdapter.FilmViewHolder>(FilmDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class FilmViewHolder(
        private val binding: ItemFilmGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(film: Film) {
            // Fixed 2:3 decode target (4-column grid) — no per-bind post{} and no
            // full-resolution decode.
            val (w, h) = FilmGridSizes.cellFor(binding.root, GRID_SPAN) ?: (0 to 0)
            FilmGridCell.loadPoster(binding.ivPoster, film.posterUrl, film.title, w, h)

            binding.ratingContainer.visibility = View.GONE
            binding.icHasReview.visibility = View.GONE

            binding.posterContainer.setOnClickListener {
                onFilmClick(film)
            }

            binding.posterContainer.setOnLongClickListener { view ->
                val movie = Movie(
                    id = film.id,
                    title = film.title,
                    posterUrl = film.posterUrl,
                    averageRating = null,
                    genre = null,
                    releaseYear = film.year.toIntOrNull(),
                    description = null
                )
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { onFilmClick(film) },
                    onLogFilm = { onLogFilm?.invoke(film) },
                    onChangePoster = { onChangePoster?.invoke(film) }
                )
                true
            }
        }
    }

    private companion object {
        /** The filmography grid is 4 columns. */
        const val GRID_SPAN = 4
    }

    private class FilmDiffCallback : DiffUtil.ItemCallback<Film>() {
        override fun areItemsTheSame(
            oldItem: Film,
            newItem: Film
        ): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(
            oldItem: Film,
            newItem: Film
        ): Boolean {
            return oldItem == newItem
        }
    }
}
