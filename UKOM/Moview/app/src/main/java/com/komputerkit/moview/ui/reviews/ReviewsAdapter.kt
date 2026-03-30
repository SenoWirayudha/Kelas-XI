package com.komputerkit.moview.ui.reviews

import android.os.Build
import android.text.Html
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ItemReviewUserBinding

class ReviewsAdapter(
    private val onReviewClick: (ReviewItem) -> Unit,
    private val onUserClick: ((Int) -> Unit)? = null
) : ListAdapter<ReviewItem, ReviewsAdapter.ReviewViewHolder>(ReviewDiffCallback()) {

    var userHasWatched: Boolean = false

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ReviewViewHolder(binding, onReviewClick, onUserClick)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        holder.bind(getItem(position), userHasWatched)
    }

    class ReviewViewHolder(
        private val binding: ItemReviewUserBinding,
        private val onReviewClick: (ReviewItem) -> Unit,
        private val onUserClick: ((Int) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(review: ReviewItem, userHasWatched: Boolean) {
            binding.tvUsername.text = review.username
            binding.tvTimestamp.text = review.timestamp
            binding.ratingBar.rating = review.rating

            // Determine spoiler state
            val showSpoiler = review.isSpoiler && !userHasWatched
            if (showSpoiler) {
                binding.tvReviewText.visibility = View.GONE
                binding.cardSpoilerOverlay.visibility = View.VISIBLE
            } else {
                binding.tvReviewText.visibility = View.VISIBLE
                binding.cardSpoilerOverlay.visibility = View.GONE
                binding.tvReviewText.text = decodeReviewText(review.content)
            }

            // Tap spoiler overlay to reveal content
            binding.cardSpoilerOverlay.setOnClickListener {
                binding.cardSpoilerOverlay.visibility = View.GONE
                binding.tvReviewText.visibility = View.VISIBLE
                binding.tvReviewText.text = decodeReviewText(review.content)
            }
            
            // Load user avatar
            Glide.with(binding.root.context)
                .load(if (!review.userAvatar.isNullOrEmpty()) com.komputerkit.moview.util.ServerConfig.fixUrl(review.userAvatar) else review.userAvatar)
                .placeholder(R.drawable.ic_profile)
                .circleCrop()
                .into(binding.ivUserPhoto)
            
            // Tap review card → open review detail
            binding.root.setOnClickListener {
                onReviewClick(review)
            }

            // Tap user photo or username → open profile
            binding.ivUserPhoto.setOnClickListener {
                onUserClick?.invoke(review.userId)
            }
            binding.tvUsername.setOnClickListener {
                onUserClick?.invoke(review.userId)
            }
        }

        private fun decodeReviewText(raw: String): CharSequence {
            // Decode once/twice to handle both "&#128512;" and "&amp;#128512;" payloads.
            var decoded = raw
            repeat(2) {
                val next = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    Html.fromHtml(decoded, Html.FROM_HTML_MODE_COMPACT).toString()
                } else {
                    @Suppress("DEPRECATION")
                    Html.fromHtml(decoded).toString()
                }
                if (next == decoded) {
                    return decoded
                }
                decoded = next
            }
            return decoded
        }
    }

    private class ReviewDiffCallback : DiffUtil.ItemCallback<ReviewItem>() {
        override fun areItemsTheSame(oldItem: ReviewItem, newItem: ReviewItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ReviewItem, newItem: ReviewItem): Boolean {
            return oldItem == newItem
        }
    }
}
