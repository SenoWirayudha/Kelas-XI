package com.komputerkit.moview.ui.review

import android.text.Html
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.databinding.ItemReviewBinding
import com.komputerkit.moview.util.loadPoster

class ReviewAdapter(
    private val onReviewClick: (Review) -> Unit
) : ListAdapter<Review, ReviewAdapter.ReviewViewHolder>(ReviewDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewBinding.inflate(
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
        private val binding: ItemReviewBinding,
        private val onReviewClick: (Review) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(review: Review) {
            binding.tvTitle.text = review.movie.title
            binding.tvYear.text = review.movie.releaseYear.toString()
            
            // Update date label based on rewatch status
            binding.tvDate.text = if (review.isRewatch) {
                review.dateLabel.replace("Watched", "Rewatched")
            } else {
                review.dateLabel
            }
            
            // Render HTML in review text
            val reviewHtml = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                Html.fromHtml(review.reviewText, Html.FROM_HTML_MODE_COMPACT)
            } else {
                @Suppress("DEPRECATION")
                Html.fromHtml(review.reviewText)
            }
            binding.tvReviewPreview.text = reviewHtml

            // Display star rating - rating is already in 0-5 scale
            val starCount = review.rating.toInt().coerceIn(0, 5)
            val stars = "★".repeat(starCount)
            binding.tvRatingStars.text = stars

            // Show liked icon if movie is liked
            binding.ivLiked.visibility = if (review.isLiked) android.view.View.VISIBLE else android.view.View.GONE

            // Show rewatch icon if this is a rewatch
            binding.ivRewatch.visibility = if (review.isRewatch) android.view.View.VISIBLE else android.view.View.GONE

            // Load poster using Glide extension for fast loading
            binding.ivPoster.loadPoster(review.movie.posterUrl)

            binding.root.setOnClickListener {
                onReviewClick(review)
            }

            binding.ivPoster.setOnClickListener {
                onReviewClick(review)
            }
        }
    }

    private class ReviewDiffCallback : DiffUtil.ItemCallback<Review>() {
        override fun areItemsTheSame(oldItem: Review, newItem: Review): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Review, newItem: Review): Boolean {
            return oldItem == newItem
        }
    }
}
