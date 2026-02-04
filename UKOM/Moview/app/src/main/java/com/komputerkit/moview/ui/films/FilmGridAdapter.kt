package com.komputerkit.moview.ui.films

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
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
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmGridAdapter.FilmViewHolder>(FilmDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding, onMovieClick, onReviewClick, onLongPressGoToFilm)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class FilmViewHolder(
        private val binding: ItemFilmGridBinding,
        private val onMovieClick: (Movie) -> Unit,
        private val onReviewClick: ((Movie) -> Unit)?,
        private val onLongPressGoToFilm: ((Movie) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(movie: Movie) {
            // Load poster with optimization
            if (!movie.posterUrl.isNullOrEmpty()) {
                Glide.with(binding.root.context)
                    .load(movie.posterUrl)
                    .thumbnail(0.1f)  // Load 10% thumbnail first for fast preview
                    .placeholder(R.drawable.placeholder_poster)  // Show placeholder while loading
                    .error(R.drawable.placeholder_poster)  // Show placeholder if error
                    .diskCacheStrategy(DiskCacheStrategy.ALL)  // Cache both original & resized
                    .centerCrop()
                    .into(binding.ivPoster)
                Log.d("FilmGridAdapter", "Loading poster for ${movie.title}: ${movie.posterUrl}")
            } else {
                // No poster URL, show placeholder
                binding.ivPoster.setImageResource(R.drawable.placeholder_poster)
                Log.w("FilmGridAdapter", "No poster URL for ${movie.title}")
            }
            
            // Show review icon if movie has review
            binding.icHasReview.visibility = if (movie.hasReview) View.VISIBLE else View.GONE
            
            // Display user rating as stars
            updateStarRating(movie.userRating)
            
            // Show liked icon if movie is liked
            Log.d("FilmGridAdapter", "Film: ${movie.title}, isLiked=${movie.isLiked}, rating=${movie.userRating}")
            binding.ivLiked.visibility = if (movie.isLiked) View.VISIBLE else View.GONE
            
            // Poster click - navigate to Film Detail
            binding.posterContainer.setOnClickListener {
                onMovieClick(movie)
            }
            
            // Long press to show movie actions
            binding.posterContainer.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = onLongPressGoToFilm ?: onMovieClick
                )
                true
            }
            
            // Review icon click - navigate to Review Detail (if has review)
            if (movie.hasReview) {
                binding.icHasReview.setOnClickListener {
                    onReviewClick?.invoke(movie)
                }
            }
        }
        
        private fun updateStarRating(rating: Float) {
            val stars = listOf(
                binding.star1,
                binding.star2,
                binding.star3,
                binding.star4,
                binding.star5
            )
            
            // Always show the rating container (it contains the like icon too)
            binding.ratingContainer.visibility = View.VISIBLE
            
            if (rating == 0f) {
                // No rating - hide all stars
                stars.forEach { star ->
                    star.visibility = View.GONE
                }
                return
            }
            
            // Show all stars
            stars.forEach { star ->
                star.visibility = View.VISIBLE
            }
            
            // Round to nearest 0.5 for display
            val roundedRating = (rating * 2).toInt() / 2f
            
            stars.forEachIndexed { index, star ->
                val starPosition = index + 1
                if (roundedRating >= starPosition) {
                    // Full star
                    star.setImageResource(com.komputerkit.moview.R.drawable.ic_star_filled)
                } else if (roundedRating >= starPosition - 0.5f) {
                    // Half star - use filled star but could create half-star drawable
                    // For now, we'll just show outline for half stars
                    star.setImageResource(com.komputerkit.moview.R.drawable.ic_star_outline)
                    star.alpha = 0.5f
                } else {
                    // Empty star
                    star.setImageResource(com.komputerkit.moview.R.drawable.ic_star_outline)
                    star.alpha = 0.3f
                }
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
