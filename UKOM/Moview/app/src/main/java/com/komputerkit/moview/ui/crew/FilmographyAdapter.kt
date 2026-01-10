package com.komputerkit.moview.ui.crew

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.databinding.ItemFilmographyGridBinding

class FilmographyAdapter(
    private val onFilmClick: (Film) -> Unit
) : ListAdapter<Film, FilmographyAdapter.FilmViewHolder>(FilmDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmographyGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class FilmViewHolder(
        private val binding: ItemFilmographyGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(film: Film) {
            Glide.with(binding.ivPoster)
                .load(film.posterUrl)
                .into(binding.ivPoster)
            
            binding.tvYear.text = film.year
            
            binding.root.setOnClickListener {
                onFilmClick(film)
            }
        }
    }

    private class FilmDiffCallback : DiffUtil.ItemCallback<Film>() {
        override fun areItemsTheSame(
            oldItem: Film,
            newItem: Film
        ): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(
            oldItem: Film,
            newItem: Film
        ): Boolean {
            return oldItem == newItem
        }
    }
}
