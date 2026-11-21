package com.komputerkit.moview.ui.filmlist

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.ui.common.FilmGridDiff
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.ui.common.FilmGridCell
import com.komputerkit.moview.ui.common.FilmGridSizes

class FilmGridAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmGridAdapter.FilmViewHolder>(FilmGridDiff) {


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position), onMovieClick, onLogFilm, onChangePoster)
    }

    class FilmViewHolder(
        private val binding: ItemFilmGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            // Star configuration is constant per holder: set it once instead of
            // on every bind (setters would requestLayout + invalidate).
            binding.starRating.apply {
                starSizeDp = 10f
                starGapDp = 0f
                displayMode = true
                setColors(
                    ContextCompat.getColor(context, R.color.star_green),
                    ContextCompat.getColor(context, R.color.star_green_empty)
                )
            }
        }

        fun bind(movie: Movie, onClick: (Movie) -> Unit, onLogFilm: ((Movie) -> Unit)? = null, onChangePoster: ((Movie) -> Unit)? = null) {
            // Exact cell size (2:3 of the grid cell): one decode per size, cache hits on scroll-back.
            val (w, h) = FilmGridSizes.cellFor(binding.root, GRID_SPAN) ?: (0 to 0)
            FilmGridCell.loadPoster(binding.ivPoster, movie.posterUrl, movie.title, w, h)

            // Show rating if user has rated
            if (movie.userRating > 0) {
                binding.ratingContainer.visibility = android.view.View.VISIBLE
                binding.starRating.rating = movie.userRating
            } else {
                binding.ratingContainer.visibility = android.view.View.GONE
            }
            
            // Show review icon if has review
            binding.icHasReview.visibility = if (movie.hasReview) {
                android.view.View.VISIBLE
            } else {
                android.view.View.GONE
            }
            
            binding.posterContainer.setOnClickListener {
                onClick(movie)
            }

            binding.posterContainer.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = onClick,
                    onLogFilm = onLogFilm,
                    onChangePoster = onChangePoster
                )
                true
            }
        }
    }

    private companion object {
        /** The category/watchlist/likes grids are 4 columns. */
        const val GRID_SPAN = 4
    }

}
