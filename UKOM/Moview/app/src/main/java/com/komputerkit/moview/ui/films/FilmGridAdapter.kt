package com.komputerkit.moview.ui.films

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding

class FilmGridAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onReviewClick: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, FilmGridAdapter.FilmViewHolder>(FilmDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding, onMovieClick, onReviewClick)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class FilmViewHolder(
        private val binding: ItemFilmGridBinding,
        private val onMovieClick: (Movie) -> Unit,
        private val onReviewClick: ((Movie) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(movie: Movie) {
            Glide.with(binding.root.context)
                .load(movie.posterUrl)
                .into(binding.ivPoster)
            
            // Show review icon if movie has review
            binding.icHasReview.visibility = if (movie.hasReview) View.VISIBLE else View.GONE
            
            // Display user rating as stars
            updateStarRating(movie.userRating)
            
            // Poster click - navigate to Film Detail
            binding.posterContainer.setOnClickListener {
                onMovieClick(movie)
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
            
            if (rating == 0f) {
                // No rating - hide the rating container
                binding.ratingContainer.visibility = View.GONE
                return
            }
            
            binding.ratingContainer.visibility = View.VISIBLE
            
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
