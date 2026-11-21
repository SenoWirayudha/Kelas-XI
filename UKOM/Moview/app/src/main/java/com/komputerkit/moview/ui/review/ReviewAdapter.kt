package com.komputerkit.moview.ui.review

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import androidx.core.content.ContextCompat
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.databinding.ItemReviewBinding
import com.komputerkit.moview.util.HtmlText
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail

class ReviewAdapter(
    private val onReviewClick: (Review) -> Unit,
    private val onLogFilm: ((Review) -> Unit)? = null,
    private val onChangePoster: ((Review) -> Unit)? = null
) : ListAdapter<Review, ReviewAdapter.ReviewViewHolder>(ReviewDiffCallback()) {


    var isOwnProfile: Boolean = true

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ReviewViewHolder(binding, onReviewClick, onLogFilm, onChangePoster)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        holder.bind(getItem(position), isOwnProfile)
    }

    class ReviewViewHolder(
        private val binding: ItemReviewBinding,
        private val onReviewClick: (Review) -> Unit,
        private val onLogFilm: ((Review) -> Unit)? = null,
        private val onChangePoster: ((Review) -> Unit)? = null
    ) : RecyclerView.ViewHolder(binding.root) {

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

        fun bind(review: Review, isOwnProfile: Boolean) {
            binding.tvTitle.text = review.movie.title
            binding.tvYear.text = review.movie.releaseYear.toString()
            
            // Update date label based on rewatch status
            binding.tvDate.text = if (review.isRewatch) {
                review.dateLabel.replace("Watched", "Rewatched")
            } else {
                review.dateLabel
            }

            // Spoiler: hide preview if spoiler and not own profile
            val showSpoiler = review.isSpoiler && !isOwnProfile
            if (showSpoiler) {
                binding.tvReviewPreview.visibility = View.GONE
                binding.layoutSpoilerOverlay.visibility = View.VISIBLE
            } else {
                // Render HTML in review text (decoded once per review, cached)
                binding.tvReviewPreview.text = HtmlText.decode(review.reviewText)
                binding.tvReviewPreview.visibility = View.VISIBLE
                binding.layoutSpoilerOverlay.visibility = View.GONE
            }

            // Tap spoiler overlay to reveal
            binding.layoutSpoilerOverlay.setOnClickListener {
                binding.tvReviewPreview.text = HtmlText.decode(review.reviewText)
                binding.tvReviewPreview.visibility = View.VISIBLE
                binding.layoutSpoilerOverlay.visibility = View.GONE
            }

            // Display star rating - supports half-star
            binding.starRating.rating = review.rating
            binding.starRating.visibility = if (review.rating > 0f) View.VISIBLE else View.GONE

            // Show liked icon if movie is liked
            binding.ivLiked.visibility = if (review.isLiked) View.VISIBLE else View.GONE

            // Show rewatch icon if this is a rewatch
            binding.ivRewatch.visibility = if (review.isRewatch) View.VISIBLE else View.GONE

            // Load poster using Glide extension for fast loading
            binding.ivPoster.loadThumbnail(review.movie.posterUrl, review.movie.title)

            binding.root.setOnClickListener {
                onReviewClick(review)
            }

            binding.ivPoster.setOnClickListener {
                onReviewClick(review)
            }

            binding.ivPoster.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = review.movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { onReviewClick(review) },
                    onLogFilm = { onLogFilm?.invoke(review) },
                    onChangePoster = { onChangePoster?.invoke(review) }
                )
                true
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
