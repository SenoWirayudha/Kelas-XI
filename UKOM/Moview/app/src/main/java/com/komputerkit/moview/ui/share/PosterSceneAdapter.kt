package com.komputerkit.moview.ui.share

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Artwork
import com.komputerkit.moview.databinding.ItemPosterSceneBinding

/**
 * Grid of the film's backdrops. Tapping toggles selection; the badge shows the panel order
 * (1-3) so users know which scene ends up at the top of the collage.
 */
class PosterSceneAdapter(
    private val selectedOrder: (Artwork) -> Int,
    private val onClick: (Artwork) -> Unit
) : ListAdapter<Artwork, PosterSceneAdapter.SceneViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SceneViewHolder {
        val binding = ItemPosterSceneBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SceneViewHolder(binding, selectedOrder, onClick)
    }

    override fun onBindViewHolder(holder: SceneViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class SceneViewHolder(
        private val binding: ItemPosterSceneBinding,
        private val selectedOrder: (Artwork) -> Int,
        private val onClick: (Artwork) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(artwork: Artwork) {
            Glide.with(binding.root.context)
                .load(artwork.url)
                .thumbnail(0.15f)
                .placeholder(R.color.dark_card)
                .error(R.color.dark_card)
                .override(800, 450)
                .centerCrop()
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .into(binding.ivScene)

            val order = selectedOrder(artwork)

            if (order > 0) {
                binding.cardScene.strokeWidth = 6
                binding.cardScene.strokeColor = ContextCompat.getColor(
                    binding.root.context, R.color.accent_blue
                )
                binding.selectionOverlay.visibility = View.VISIBLE
                binding.tvOrder.visibility = View.VISIBLE
                binding.tvOrder.text = order.toString()
            } else {
                binding.cardScene.strokeWidth = 0
                binding.selectionOverlay.visibility = View.GONE
                binding.tvOrder.visibility = View.GONE
            }

            binding.root.setOnClickListener { onClick(artwork) }
        }
    }

    private class DiffCallback : DiffUtil.ItemCallback<Artwork>() {
        override fun areItemsTheSame(oldItem: Artwork, newItem: Artwork): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Artwork, newItem: Artwork): Boolean =
            oldItem == newItem
    }
}