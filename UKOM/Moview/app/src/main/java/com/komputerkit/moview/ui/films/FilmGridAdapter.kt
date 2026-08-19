package com.komputerkit.moview.ui.films

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.util.MovieActionsHelper

class FilmGridAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onReviewClick: ((Movie) -> Unit)? = null,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmGridAdapter.FilmViewHolder>(FilmDiffCallback()) {


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

        fun bind(movie: Movie) {
            // Load poster with optimization
            if (!movie.posterUrl.isNullOrEmpty()) {
                val fixedUrl = com.komputerkit.moview.util.ServerConfig.fixUrl(movie.posterUrl)
                Glide.with(binding.root.context)
                    .load(fixedUrl)
                    .thumbnail(0.1f)  // Load 10% thumbnail first for fast preview
                    .placeholder(com.komputerkit.moview.util.PosterFallbackDrawable(binding.root.context, movie.title))  // Show fallback while loading
                    .error(com.komputerkit.moview.util.PosterFallbackDrawable(binding.root.context, movie.title))  // Show fallback if error
                    .diskCacheStrategy(DiskCacheStrategy.ALL)  // Cache both original & resized
                    .centerCrop()
                    .into(binding.ivPoster)
                Log.d("FilmGridAdapter", "Loading poster for ${movie.title}: ${movie.posterUrl}")
            } else {
                // No poster URL, show fallback
                binding.ivPoster.setImageDrawable(com.komputerkit.moview.util.PosterFallbackDrawable(binding.root.context, movie.title))
                Log.w("FilmGridAdapter", "No poster URL for ${movie.title}")
            }
            
            // Show review icon if movie has review
            binding.icHasReview.visibility = if (movie.hasReview) View.VISIBLE else View.GONE
            
            // Display user rating as stars
            updateStarRating(movie.userRating)
            
            // Show liked icon if movie is liked
            Log.d("FilmGridAdapter", "Film: ${movie.title}, isLiked=${movie.isLiked}, rating=${movie.userRating}")
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
            binding.ratingContainer.visibility = View.VISIBLE
            binding.starRating.apply {
                if (rating == 0f) {
                    visibility = View.GONE
                    return@apply
                }
                visibility = View.VISIBLE
                starSizeDp = 10f
                starGapDp = 0f
                displayMode = true
                setColors(
                    ContextCompat.getColor(context, R.color.star_green),
                    ContextCompat.getColor(context, R.color.star_green_empty)
                )
                this@FilmViewHolder.binding.starRating.rating = rating
            }
        }
    }

    private class FilmDiffCallback : DiffUtil.ItemCallback<Movie>() {
        override fun areItemsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem == newItem
        }
    }
}
