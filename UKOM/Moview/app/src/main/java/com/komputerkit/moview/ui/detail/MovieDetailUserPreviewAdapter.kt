package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemMovieDetailUserPreviewBinding
import com.komputerkit.moview.util.loadProfilePhoto

data class MovieDetailUserPreviewItem(
    val userId: Int,
    val profilePhoto: String?,
    val starsText: String,
    val reviewId: Int? = null
)

class MovieDetailUserPreviewAdapter(
    private val showStars: Boolean,
    private val onItemClick: (MovieDetailUserPreviewItem) -> Unit,
    private val onBadgeClick: (MovieDetailUserPreviewItem) -> Unit
) : ListAdapter<MovieDetailUserPreviewItem, MovieDetailUserPreviewAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemMovieDetailUserPreviewBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding, showStars, onItemClick, onBadgeClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemMovieDetailUserPreviewBinding,
        private val showStars: Boolean,
        private val onItemClick: (MovieDetailUserPreviewItem) -> Unit,
        private val onBadgeClick: (MovieDetailUserPreviewItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: MovieDetailUserPreviewItem) {
            binding.ivAvatar.loadProfilePhoto(item.profilePhoto)
            val starCount = item.starsText.count { it == '★' }.coerceIn(0, 5)
            binding.tvStars.text = "★".repeat(starCount)
            binding.tvStars.visibility = if (showStars && starCount > 0) View.VISIBLE else View.INVISIBLE
            binding.ivBadgeAction.visibility = if ((item.reviewId ?: 0) > 0) View.VISIBLE else View.GONE

            binding.layoutAvatarContainer.setOnClickListener { onItemClick(item) }
            binding.ivAvatar.setOnClickListener { onItemClick(item) }
            binding.ivBadgeAction.setOnClickListener { onBadgeClick(item) }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<MovieDetailUserPreviewItem>() {
        override fun areItemsTheSame(oldItem: MovieDetailUserPreviewItem, newItem: MovieDetailUserPreviewItem): Boolean {
            return oldItem.userId == newItem.userId
        }

        override fun areContentsTheSame(oldItem: MovieDetailUserPreviewItem, newItem: MovieDetailUserPreviewItem): Boolean {
            return oldItem == newItem
        }
    }
}
