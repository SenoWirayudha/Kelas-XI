package com.komputerkit.moview.ui.filmography

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail

class FilmographyAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmographyAdapter.FilmographyViewHolder>(FilmographyDiffCallback()) {

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

        fun bind(movie: Movie) {
            binding.ivPoster.setImageDrawable(null)

            binding.ivPoster.post {
                val fixedUrl = if (!movie.posterUrl.isNullOrEmpty()) com.komputerkit.moview.util.ServerConfig.fixUrl(movie.posterUrl) else movie.posterUrl
                val width = binding.ivPoster.width
                if (width > 0) {
                    val height = (width * 1.5).toInt()
                    Glide.with(binding.ivPoster.context)
                        .load(fixedUrl)
                        .override(width, height)
                        .placeholder(com.komputerkit.moview.util.PosterFallbackDrawable(binding.ivPoster.context, movie.title))
                        .error(com.komputerkit.moview.util.PosterFallbackDrawable(binding.ivPoster.context, movie.title))
                        .centerCrop()
                        .into(binding.ivPoster)
                } else {
                    binding.ivPoster.loadThumbnail(fixedUrl, movie.title)
                }
            }

            binding.ratingContainer.visibility = if (movie.userRating > 0) View.VISIBLE else View.GONE
            if (movie.userRating > 0) {
                updateStars(movie.userRating)
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

        private fun updateStars(rating: Float) {
            binding.starRating.apply {
                starSizeDp = 10f
                starGapDp = 0f
                displayMode = true
                setColors(
                    androidx.core.content.ContextCompat.getColor(context, com.komputerkit.moview.R.color.star_green),
                    androidx.core.content.ContextCompat.getColor(context, com.komputerkit.moview.R.color.star_green_empty)
                )
                this@FilmographyViewHolder.binding.starRating.rating = rating
            }
        }
    }

    private class FilmographyDiffCallback : DiffUtil.ItemCallback<Movie>() {
        override fun areItemsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem == newItem
        }
    }
}
