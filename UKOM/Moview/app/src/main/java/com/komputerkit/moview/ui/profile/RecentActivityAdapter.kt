package com.komputerkit.moview.ui.profile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.databinding.ItemRecentActivityBinding
import com.komputerkit.moview.util.MovieActionsHelper
import kotlin.math.roundToInt

class RecentActivityAdapter(
    private val onMovieClick: ((DiaryEntry) -> Unit)? = null,
    private val onLongPressGoToFilm: ((DiaryEntry) -> Unit)? = null,
    private val onReviewClick: ((Int) -> Unit)? = null
) : RecyclerView.Adapter<RecentActivityAdapter.RecentActivityViewHolder>() {
    
    private var activities: List<DiaryEntry> = emptyList()
    
    fun submitList(list: List<DiaryEntry>) {
        activities = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecentActivityViewHolder {
        val binding = ItemRecentActivityBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return RecentActivityViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: RecentActivityViewHolder, position: Int) {
        holder.bind(activities[position])
    }
    
    override fun getItemCount(): Int = activities.size
    
    inner class RecentActivityViewHolder(
        private val binding: ItemRecentActivityBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(entry: DiaryEntry) {
            Glide.with(binding.root.context)
                .load(entry.movie.posterUrl)
                .into(binding.ivPoster)
            
            // Show rating stars
            binding.tvRating.text = getStarsFromRating(entry.rating)
            
            // Show rewatch icon if rewatched
            binding.ivRewatch.visibility = if (entry.isRewatched) View.VISIBLE else View.GONE
            
            // Show review icon if has review
            binding.ivReview.visibility = if (entry.hasReview) View.VISIBLE else View.GONE
            
            // Click poster - if has review go to review detail, otherwise go to movie detail
            binding.ivPoster.setOnClickListener {
                if (entry.hasReview && entry.reviewId != null && entry.reviewId > 0) {
                    onReviewClick?.invoke(entry.reviewId)
                } else {
                    onMovieClick?.invoke(entry)
                }
            }
            

            
            // Long press on poster to show movie actions
            binding.ivPoster.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = entry.movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { movie ->
                        onLongPressGoToFilm?.invoke(entry)
                    }
                )
                true
            }
        }
        
        private fun getStarsFromRating(rating: Int): String {
            val fullStars = rating.coerceIn(0, 5)
            return "★".repeat(fullStars)
        }
    }
}
