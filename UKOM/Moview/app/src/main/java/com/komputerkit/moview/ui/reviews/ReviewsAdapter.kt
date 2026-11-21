package com.komputerkit.moview.ui.reviews

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ItemReviewUserBinding
import com.komputerkit.moview.util.HtmlText
import com.komputerkit.moview.util.loadProfilePhoto

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

        /** Shared tint: avoids allocating a ColorStateList on every bind. */
        private val likeTint = android.content.res.ColorStateList.valueOf(
            ContextCompat.getColor(binding.root.context, R.color.red)
        )
        
        init {
            // Constant per holder: configured once, not on every bind.
            binding.starRating.apply {
                displayMode = true
                starSizeDp = 12f
                starGapDp = 0f
                setColors(
                    ContextCompat.getColor(context, R.color.star_green),
                    ContextCompat.getColor(context, R.color.star_green_empty)
                )
            }
        }

        fun bind(review: ReviewItem, userHasWatched: Boolean) {
            binding.tvUsername.text = review.username
            binding.tvTimestamp.text = review.timestamp

            // Display star rating - supports half-star
            binding.starRating.rating = review.rating
            binding.starRating.visibility = if (review.rating > 0f) View.VISIBLE else View.GONE

            // Like icon - only shown when the reviewer actually liked the film.
            // When hidden it is GONE (not INVISIBLE) so the card keeps its layout.
            if (review.isLiked) {
                binding.ivLike.setImageResource(R.drawable.ic_heart_filled)
                binding.ivLike.imageTintList = likeTint
                binding.ivLike.visibility = View.VISIBLE
            } else {
                binding.ivLike.visibility = View.GONE
            }

            // Determine spoiler state
            val showSpoiler = review.isSpoiler && !userHasWatched
            if (showSpoiler) {
                binding.tvReviewText.visibility = View.GONE
                binding.cardSpoilerOverlay.visibility = View.VISIBLE
            } else {
                binding.tvReviewText.visibility = View.VISIBLE
                binding.cardSpoilerOverlay.visibility = View.GONE
                binding.tvReviewText.text = HtmlText.decodeToString(review.content)
            }

            // Tap spoiler overlay to reveal content
            binding.cardSpoilerOverlay.setOnClickListener {
                binding.cardSpoilerOverlay.visibility = View.GONE
                binding.tvReviewText.visibility = View.VISIBLE
                binding.tvReviewText.text = HtmlText.decodeToString(review.content)
            }
            
            // Load user avatar
            binding.ivUserPhoto.loadProfilePhoto(review.userAvatar)
            
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
