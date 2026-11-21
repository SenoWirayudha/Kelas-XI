package com.komputerkit.moview.ui.filmography

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.ui.common.FilmGridDiff
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.ui.common.FilmGridCell
import com.komputerkit.moview.ui.common.FilmGridSizes

class FilmographyAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmographyAdapter.FilmographyViewHolder>(FilmGridDiff) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmographyViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmographyViewHolder(binding, onMovieClick, onLongPressGoToFilm, onLogFilm, onChangePoster)
    }

    override fun onBindViewHolder(holder: FilmographyViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class FilmographyViewHolder(
        private val binding: ItemFilmGridBinding,
        private val onMovieClick: (Movie) -> Unit,
        private val onLongPressGoToFilm: ((Movie) -> Unit)?,
        private val onLogFilm: ((Movie) -> Unit)?,
        private val onChangePoster: ((Movie) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            // Star configuration is constant per holder: set it once instead of
            // on every bind (setters would requestLayout + invalidate).
            binding.starRating.apply {
                starSizeDp = 10f
                starGapDp = 0f
                displayMode = true
                setColors(
                    androidx.core.content.ContextCompat.getColor(context, com.komputerkit.moview.R.color.star_green),
                    androidx.core.content.ContextCompat.getColor(context, com.komputerkit.moview.R.color.star_green_empty)
                )
            }
        }

        fun bind(movie: Movie) {
            // Fixed 2:3 decode target (4-column grid) — no per-bind post{} and no
            // full-resolution decode.
            val (w, h) = FilmGridSizes.cellFor(binding.root, GRID_SPAN) ?: (0 to 0)
            FilmGridCell.loadPoster(binding.ivPoster, movie.posterUrl, movie.title, w, h)

            binding.ratingContainer.visibility = if (movie.userRating > 0) View.VISIBLE else View.GONE
            if (movie.userRating > 0) {
                binding.starRating.rating = movie.userRating
            }

            binding.icHasReview.visibility = if (movie.hasReview) View.VISIBLE else View.GONE

            binding.posterContainer.setOnClickListener {
                onMovieClick(movie)
            }

            binding.posterContainer.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = onLongPressGoToFilm ?: onMovieClick,
                    onLogFilm = onLogFilm,
                    onChangePoster = onChangePoster
                )
                true
            }
        }
    }

    private companion object {
        /** The filmography grid is 4 columns. */
        const val GRID_SPAN = 4
    }

}
