package com.komputerkit.moview.ui.films

import android.view.LayoutInflater
import android.view.View
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
    private val onReviewClick: ((Movie) -> Unit)? = null,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmGridAdapter.FilmViewHolder>(FilmGridDiff) {


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding, onMovieClick, onReviewClick, onLongPressGoToFilm, onLogFilm, onChangePoster)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class FilmViewHolder(
        private val binding: ItemFilmGridBinding,
        private val onMovieClick: (Movie) -> Unit,
        private val onReviewClick: ((Movie) -> Unit)?,
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
                    ContextCompat.getColor(context, R.color.star_green),
                    ContextCompat.getColor(context, R.color.star_green_empty)
                )
            }
        }

        fun bind(movie: Movie) {
            // Fixed 2:3 decode target (4-column grid): no full-resolution decode
            // and scrolling back to an item is a memory-cache hit.
            val (w, h) = FilmGridSizes.cellFor(binding.root, GRID_SPAN) ?: (0 to 0)
            FilmGridCell.loadPoster(binding.ivPoster, movie.posterUrl, movie.title, w, h)

            // Show review icon if movie has review
            binding.icHasReview.visibility = if (movie.hasReview) View.VISIBLE else View.GONE
            
            // Display user rating as stars
            updateStarRating(movie.userRating)
            
            // Show liked icon if movie is liked
            binding.ivLiked.visibility = if (movie.isLiked) View.VISIBLE else View.GONE
            
            // Poster click - if has review go to review detail, otherwise go to film detail
            binding.posterContainer.setOnClickListener {
                if (movie.hasReview && movie.reviewId > 0) {
                    onReviewClick?.invoke(movie)
                } else {
                    onMovieClick(movie)
                }
            }
            
            // Long press to show movie actions
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
        
        private fun updateStarRating(rating: Float) {
            if (rating == 0f) {
                binding.ratingContainer.visibility = View.GONE
                binding.starRating.visibility = View.GONE
                return
            }
            binding.ratingContainer.visibility = View.VISIBLE
            binding.starRating.visibility = View.VISIBLE
            binding.starRating.rating = rating
        }
    }

    private companion object {
        /** The profile films grid is 4 columns. */
        const val GRID_SPAN = 4
    }

}
