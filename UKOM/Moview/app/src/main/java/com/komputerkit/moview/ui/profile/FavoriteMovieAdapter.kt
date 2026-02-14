package com.komputerkit.moview.ui.profile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFavoriteMovieBinding
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.MovieActionsHelper

class FavoriteMovieAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onReviewClick: ((Int) -> Unit)? = null,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null
) : RecyclerView.Adapter<FavoriteMovieAdapter.FavoriteMovieViewHolder>() {
    
    private var movies: List<Movie> = emptyList()
    
    fun submitList(list: List<Movie>) {
        movies = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FavoriteMovieViewHolder {
        val binding = ItemFavoriteMovieBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FavoriteMovieViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: FavoriteMovieViewHolder, position: Int) {
        holder.bind(movies[position])
    }
    
    override fun getItemCount(): Int = movies.size
    
    inner class FavoriteMovieViewHolder(
        private val binding: ItemFavoriteMovieBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(movie: Movie) {
            binding.ivPoster.loadThumbnail(movie.posterUrl)
            
            // Root click behavior:
            // - If has review: navigate to review detail
            // - If no review: navigate to movie detail
            binding.root.setOnClickListener {
                if (movie.hasReview && movie.reviewId > 0) {
                    onReviewClick?.invoke(movie.reviewId)
                } else {
                    onMovieClick(movie)
                }
            }
            
            // Long press to show movie actions
            binding.root.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = onLongPressGoToFilm ?: onMovieClick
                )
                true
            }
        }
    }
}
