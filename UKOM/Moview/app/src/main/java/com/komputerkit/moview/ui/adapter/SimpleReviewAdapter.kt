package com.komputerkit.moview.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.ReviewData
import com.komputerkit.moview.databinding.ItemReviewSimpleBinding
import com.komputerkit.moview.util.loadPoster

class SimpleReviewAdapter(
    private val onReviewClick: (Int) -> Unit
) : ListAdapter<ReviewData, SimpleReviewAdapter.ReviewViewHolder>(ReviewDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewSimpleBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ReviewViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ReviewViewHolder(
        private val binding: ItemReviewSimpleBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(review: ReviewData) {
            binding.apply {
                // Load poster
                ivPoster.loadPoster(review.poster_path)

                // Set title and year
                tvTitle.text = review.title
                tvYear.text = review.year.toString()

                // Set rating stars
                tvRatingStars.text = if (review.rating > 0) "★".repeat(review.rating) else ""

                // Show heart icon if liked
                ivLiked.visibility = if (review.is_liked) View.VISIBLE else View.GONE

                // Set watched date
                tvDate.text = review.watched_at?.let { "Watched $it" } ?: ""

                // Show review content preview
                if (review.content.isNotEmpty()) {
                    tvReviewPreview.visibility = View.VISIBLE
                    tvReviewPreview.text = review.content
                } else {
                    tvReviewPreview.visibility = View.GONE
                }

                // Click listener
                root.setOnClickListener {
                    onReviewClick(review.review_id)
                }
            }
        }
    }

    class ReviewDiffCallback : DiffUtil.ItemCallback<ReviewData>() {
        override fun areItemsTheSame(oldItem: ReviewData, newItem: ReviewData): Boolean {
            return oldItem.review_id == newItem.review_id
        }

        override fun areContentsTheSame(oldItem: ReviewData, newItem: ReviewData): Boolean {
            return oldItem == newItem
        }
    }
}
