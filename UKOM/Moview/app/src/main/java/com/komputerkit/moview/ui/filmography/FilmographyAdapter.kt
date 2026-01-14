package com.komputerkit.moview.ui.filmography

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmographyPosterBinding

/**
 * Adapter for filmography grid that shows only movie posters without ratings.
 * Used for production house, country, genre filmography lists.
 */
class FilmographyAdapter(
    private val onMovieClick: (Movie) -> Unit
) : ListAdapter<Movie, FilmographyAdapter.FilmographyViewHolder>(FilmographyDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmographyViewHolder {
        val binding = ItemFilmographyPosterBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmographyViewHolder(binding, onMovieClick)
    }

    override fun onBindViewHolder(holder: FilmographyViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class FilmographyViewHolder(
        private val binding: ItemFilmographyPosterBinding,
        private val onMovieClick: (Movie) -> Unit
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

    private class FilmographyDiffCallback : DiffUtil.ItemCallback<Movie>() {
        override fun areItemsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem == newItem
        }
    }
}
