package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemSearchMovieBinding
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.MovieActionsHelper

class SearchMovieAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLongPressGoToFilm: ((Movie) -> Unit)? = null,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, SearchMovieAdapter.SearchMovieViewHolder>(DIFF) {
    

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchMovieViewHolder {
        val binding = ItemSearchMovieBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchMovieViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: SearchMovieViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class SearchMovieViewHolder(
        private val binding: ItemSearchMovieBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(movie: Movie) {
            binding.ivPoster.loadThumbnail(movie.posterUrl, movie.title)
            
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
                    onGoToFilm = onLongPressGoToFilm ?: onMovieClick,
                    onLogFilm = onLogFilm,
                    onChangePoster = onChangePoster
                )
                true
            }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Movie>() {
            override fun areItemsTheSame(oldItem: Movie, newItem: Movie) = oldItem.id == newItem.id
            override fun areContentsTheSame(oldItem: Movie, newItem: Movie) = oldItem == newItem
        }
    }
}
