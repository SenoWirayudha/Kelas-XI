package com.komputerkit.moview.ui.filmlist

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.util.loadThumbnail

class FilmGridAdapter(
    private val onMovieClick: (Movie) -> Unit
) : ListAdapter<Movie, FilmGridAdapter.FilmViewHolder>(FilmDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position), onMovieClick)
    }

    class FilmViewHolder(
        private val binding: ItemFilmGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(movie: Movie, onClick: (Movie) -> Unit) {
            // Clear previous image to prevent recycling issues
            binding.ivPoster.setImageDrawable(null)
            
            // Load poster with fixed size to prevent stretching
            binding.ivPoster.post {
                val width = binding.ivPoster.width
                if (width > 0) {
                    val height = (width * 1.5).toInt() // 2:3 aspect ratio
                    com.bumptech.glide.Glide.with(binding.ivPoster.context)
                        .load(movie.posterUrl)
                        .override(width, height)
                        .centerCrop()
                        .into(binding.ivPoster)
                } else {
                    binding.ivPoster.loadThumbnail(movie.posterUrl)
                }
            }
            
            // Show rating if user has rated
            if (movie.userRating > 0) {
                binding.ratingContainer.visibility = android.view.View.VISIBLE
                updateStars(movie.userRating.toInt())
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
        }
        
        private fun updateStars(rating: Int) {
            val stars = listOf(
                binding.star1,
                binding.star2,
                binding.star3,
                binding.star4,
                binding.star5
            )
            
            stars.forEachIndexed { index, star ->
                if (index < rating) {
                    star.setImageResource(com.komputerkit.moview.R.drawable.ic_star_filled)
                } else {
                    star.setImageResource(com.komputerkit.moview.R.drawable.ic_star_outline)
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
