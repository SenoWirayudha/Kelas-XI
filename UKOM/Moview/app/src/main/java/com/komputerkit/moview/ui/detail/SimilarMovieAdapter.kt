package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemSimilarMovieBinding

class SimilarMovieAdapter(
    private val onMovieClick: (Movie) -> Unit
) : ListAdapter<Movie, SimilarMovieAdapter.SimilarMovieViewHolder>(SimilarMovieDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SimilarMovieViewHolder {
        val binding = ItemSimilarMovieBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SimilarMovieViewHolder(binding, onMovieClick)
    }

    override fun onBindViewHolder(holder: SimilarMovieViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class SimilarMovieViewHolder(
        private val binding: ItemSimilarMovieBinding,
        private val onMovieClick: (Movie) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(movie: Movie) {
            binding.tvSimilarTitle.text = movie.title
            
            Glide.with(binding.root.context)
                .load(movie.posterUrl)
                .into(binding.ivSimilarPoster)
                
            binding.root.setOnClickListener {
                onMovieClick(movie)
            }
        }
    }

    private class SimilarMovieDiffCallback : DiffUtil.ItemCallback<Movie>() {
        override fun areItemsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Movie, newItem: Movie): Boolean {
            return oldItem == newItem
        }
    }
}
