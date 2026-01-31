package com.komputerkit.moview.ui.artwork

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Artwork
import com.komputerkit.moview.databinding.ItemBackdropArtworkBinding

class BackdropArtworkAdapter(
    private val onArtworkClick: (Artwork) -> Unit
) : ListAdapter<Artwork, BackdropArtworkAdapter.ArtworkViewHolder>(ArtworkDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ArtworkViewHolder {
        val binding = ItemBackdropArtworkBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ArtworkViewHolder(binding, onArtworkClick)
    }

    override fun onBindViewHolder(holder: ArtworkViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ArtworkViewHolder(
        private val binding: ItemBackdropArtworkBinding,
        private val onArtworkClick: (Artwork) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(artwork: Artwork) {
            binding.tvLabel.text = artwork.label

            Glide.with(binding.root.context)
                .load(artwork.url)
                .thumbnail(0.15f)
                .placeholder(R.color.dark_card)
                .error(R.color.dark_card)
                .override(800, 450)
                .centerCrop()
                .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.ALL)
                .into(binding.ivBackdrop)

            // Show selection state
            if (artwork.isSelected) {
                binding.cardArtwork.strokeWidth = 8
                binding.cardArtwork.strokeColor = ContextCompat.getColor(
                    binding.root.context,
                    R.color.accent_blue
                )
                binding.selectionOverlay.visibility = View.VISIBLE
                binding.ivCheckmark.visibility = View.VISIBLE
            } else {
                binding.cardArtwork.strokeWidth = 0
                binding.selectionOverlay.visibility = View.GONE
                binding.ivCheckmark.visibility = View.GONE
            }

            binding.root.setOnClickListener {
                onArtworkClick(artwork)
            }
        }
    }

    private class ArtworkDiffCallback : DiffUtil.ItemCallback<Artwork>() {
        override fun areItemsTheSame(oldItem: Artwork, newItem: Artwork): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Artwork, newItem: Artwork): Boolean {
            return oldItem == newItem
        }
    }
}
