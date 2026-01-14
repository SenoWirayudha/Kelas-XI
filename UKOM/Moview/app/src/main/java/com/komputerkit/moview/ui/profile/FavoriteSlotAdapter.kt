package com.komputerkit.moview.ui.profile

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ItemFavoriteSlotBinding
import com.komputerkit.moview.util.TmdbImageUrl

class FavoriteSlotAdapter(
    private val onAddClick: (Int) -> Unit,
    private val onRemoveClick: (Int) -> Unit
) : ListAdapter<FavoriteSlot, FavoriteSlotAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemFavoriteSlotBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        
        // Set fixed width for each item (1/4 of screen width minus margins)
        val screenWidth = parent.resources.displayMetrics.widthPixels
        val itemWidth = (screenWidth - 48 * parent.resources.displayMetrics.density) / 4
        binding.root.layoutParams.width = itemWidth.toInt()
        
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(
        private val binding: ItemFavoriteSlotBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(slot: FavoriteSlot) {
            val hasPoster = slot.movie != null
            
            // Show/hide appropriate card
            binding.cardPoster.isVisible = hasPoster
            binding.cardAdd.isVisible = !hasPoster
            
            if (hasPoster) {
                // Show movie poster
                Glide.with(binding.root.context)
                    .load(slot.movie!!.posterUrl)
                    .placeholder(R.drawable.ic_film)
                    .error(R.drawable.ic_film)
                    .into(binding.ivPoster)
                
                // Remove button click
                binding.btnRemove.setOnClickListener {
                    onRemoveClick(slot.index)
                }
            } else {
                // Add button click
                binding.cardAdd.setOnClickListener {
                    onAddClick(slot.index)
                }
            }
        }
    }

    private class DiffCallback : DiffUtil.ItemCallback<FavoriteSlot>() {
        override fun areItemsTheSame(oldItem: FavoriteSlot, newItem: FavoriteSlot): Boolean {
            return oldItem.index == newItem.index
        }

        override fun areContentsTheSame(oldItem: FavoriteSlot, newItem: FavoriteSlot): Boolean {
            return oldItem == newItem
        }
    }
}
