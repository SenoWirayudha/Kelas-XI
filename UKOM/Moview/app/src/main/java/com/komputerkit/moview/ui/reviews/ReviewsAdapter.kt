package com.komputerkit.moview.ui.reviews

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ItemReviewUserBinding

class ReviewsAdapter(
    private val onReviewClick: (ReviewItem) -> Unit
) : ListAdapter<ReviewItem, ReviewsAdapter.ReviewViewHolder>(ReviewDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ReviewViewHolder(binding, onReviewClick)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ReviewViewHolder(
        private val binding: ItemReviewUserBinding,
        private val onReviewClick: (ReviewItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(review: ReviewItem) {
            binding.tvUsername.text = review.username
            binding.tvTimestamp.text = review.timestamp
            binding.ratingBar.rating = review.rating
            binding.tvReviewText.text = review.content
            
            // Load user avatar
            Glide.with(binding.root.context)
                .load(review.userAvatar)
                .placeholder(R.drawable.ic_profile)
                .circleCrop()
                .into(binding.ivUserPhoto)
            
            binding.root.setOnClickListener {
                onReviewClick(review)
            }
            
            binding.btnReadMore.setOnClickListener {
                onReviewClick(review)
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
