package com.komputerkit.moview.ui.profile

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFavoriteMovieBinding

class FavoriteMovieAdapter(
    private val onMovieClick: (Movie) -> Unit
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
            Glide.with(binding.root.context)
                .load(movie.posterUrl)
                .into(binding.ivPoster)
                
            binding.root.setOnClickListener {
                onMovieClick(movie)
            }
        }
    }
}
