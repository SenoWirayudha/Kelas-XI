package com.komputerkit.moview.ui.popular

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemMovieGridBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail

class MovieGridAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : RecyclerView.Adapter<MovieGridAdapter.MovieGridViewHolder>() {
    
    private var movies: List<Movie> = emptyList()
    
    fun submitList(list: List<Movie>) {
        movies = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieGridViewHolder {
        val binding = ItemMovieGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MovieGridViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: MovieGridViewHolder, position: Int) {
        holder.bind(movies[position])
    }
    
    override fun getItemCount(): Int = movies.size
    
    inner class MovieGridViewHolder(
        private val binding: ItemMovieGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(movie: Movie) {
            // Load poster image
            binding.ivPoster.loadThumbnail(movie.posterUrl)
            
            // Set rating
            binding.tvRating.text = String.format("%.1f", movie.averageRating)
            
            // Set title
            binding.tvTitle.text = movie.title
            
            // Set movie info (year and genre)
            binding.tvMovieInfo.text = "${movie.releaseYear} • ${movie.genre}"
            
            // Click listener
            binding.root.setOnClickListener {
                onMovieClick(movie)
            }
            
            // Long press to show movie actions
            binding.root.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = onMovieClick,
                    onLogFilm = onLogFilm,
                    onChangePoster = onChangePoster
                )
                true
            }
        }
    }
}
