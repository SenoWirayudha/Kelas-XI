package com.komputerkit.moview.ui.review

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.databinding.ItemReviewBinding

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
            binding.tvDate.text = review.dateLabel
            binding.tvRating.text = String.format("%.1f", review.rating)
            binding.tvReviewPreview.text = review.reviewText

            Glide.with(binding.root.context)
                .load(review.movie.posterUrl)
                .into(binding.ivPoster)

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
