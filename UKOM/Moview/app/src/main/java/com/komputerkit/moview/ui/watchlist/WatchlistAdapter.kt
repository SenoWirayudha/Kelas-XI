package com.komputerkit.moview.ui.watchlist

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.databinding.ItemFilmGridBinding

class WatchlistAdapter(
    private val onItemClick: (WatchlistItem) -> Unit,
    private val onItemLongClick: (WatchlistItem) -> Unit
) : ListAdapter<WatchlistItem, WatchlistAdapter.WatchlistViewHolder>(WatchlistDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): WatchlistViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return WatchlistViewHolder(binding, onItemClick, onItemLongClick)
    }

    override fun onBindViewHolder(holder: WatchlistViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class WatchlistViewHolder(
        private val binding: ItemFilmGridBinding,
        private val onItemClick: (WatchlistItem) -> Unit,
        private val onItemLongClick: (WatchlistItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: WatchlistItem) {
            Glide.with(binding.root.context)
                .load(item.movie.posterUrl)
                .placeholder(R.color.dark_card)
                .into(binding.ivPoster)

            // Hide rating and review icon for watchlist items
            binding.ratingContainer.visibility = android.view.View.GONE
            binding.icHasReview.visibility = android.view.View.GONE

            binding.posterContainer.setOnClickListener {
                onItemClick(item)
            }

            binding.posterContainer.setOnLongClickListener {
                onItemLongClick(item)
                true
            }
        }
    }

    private class WatchlistDiffCallback : DiffUtil.ItemCallback<WatchlistItem>() {
        override fun areItemsTheSame(oldItem: WatchlistItem, newItem: WatchlistItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: WatchlistItem, newItem: WatchlistItem): Boolean {
            return oldItem == newItem
        }
    }
}
