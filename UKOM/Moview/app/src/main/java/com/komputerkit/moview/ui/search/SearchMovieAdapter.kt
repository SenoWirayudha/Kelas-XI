package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemSearchMovieBinding
import com.komputerkit.moview.util.MovieActionsHelper

class SearchMovieAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null
) : RecyclerView.Adapter<SearchMovieAdapter.SearchMovieViewHolder>() {
    
    private var movies: List<Movie> = emptyList()
    
    fun submitList(list: List<Movie>) {
        movies = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchMovieViewHolder {
        val binding = ItemSearchMovieBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchMovieViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: SearchMovieViewHolder, position: Int) {
        holder.bind(movies[position])
    }
    
    override fun getItemCount(): Int = movies.size
    
    inner class SearchMovieViewHolder(
        private val binding: ItemSearchMovieBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(movie: Movie) {
            Glide.with(binding.root.context)
                .load(movie.posterUrl)
                .into(binding.ivPoster)
            
            binding.tvTitle.text = movie.title
            binding.tvMovieInfo.text = "${movie.releaseYear} • ${movie.genre}"
            binding.tvRating.text = String.format("%.1f", movie.averageRating)
            
            binding.root.setOnClickListener {
                onMovieClick(movie)
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
