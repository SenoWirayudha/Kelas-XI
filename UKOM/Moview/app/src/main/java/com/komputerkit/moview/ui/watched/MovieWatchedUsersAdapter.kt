package com.komputerkit.moview.ui.watched

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemMovieWatchedUserBinding
import com.komputerkit.moview.util.loadProfilePhoto

data class MovieWatchedUserItem(
    val userId: Int,
    val username: String,
    val profilePhoto: String?,
    val starsText: String,
    val reviewId: Int?,
    val hasLike: Boolean,
    val hasReview: Boolean
)

class MovieWatchedUsersAdapter(
    private val onUserClick: (MovieWatchedUserItem) -> Unit
) : ListAdapter<MovieWatchedUserItem, MovieWatchedUsersAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemMovieWatchedUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding, onUserClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemMovieWatchedUserBinding,
        private val onUserClick: (MovieWatchedUserItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: MovieWatchedUserItem) {
            binding.ivAvatar.loadProfilePhoto(item.profilePhoto)
            binding.tvUsername.text = item.username
            binding.tvRatingStars.text = item.starsText

            binding.tvRatingStars.visibility = if (item.starsText.isBlank()) View.GONE else View.VISIBLE
            binding.ivLike.visibility = if (item.hasLike) View.VISIBLE else View.GONE
            binding.ivReview.visibility = if ((item.reviewId ?: 0) > 0) View.VISIBLE else View.GONE

            binding.root.setOnClickListener { onUserClick(item) }
            binding.ivAvatar.setOnClickListener { onUserClick(item) }
            binding.tvUsername.setOnClickListener { onUserClick(item) }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<MovieWatchedUserItem>() {
        override fun areItemsTheSame(oldItem: MovieWatchedUserItem, newItem: MovieWatchedUserItem): Boolean {
            return oldItem.userId == newItem.userId
        }

        override fun areContentsTheSame(oldItem: MovieWatchedUserItem, newItem: MovieWatchedUserItem): Boolean {
            return oldItem == newItem
        }
    }
}
