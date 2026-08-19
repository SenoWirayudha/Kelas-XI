package com.komputerkit.moview.ui.profile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import androidx.core.content.ContextCompat
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.databinding.ItemRecentActivityBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadPoster

class RecentActivityAdapter(
    private val onMovieClick: ((DiaryEntry) -> Unit)? = null,
    private val onLongPressGoToFilm: ((DiaryEntry) -> Unit)? = null,
    private val onReviewClick: ((Int, Int) -> Unit)? = null,  // (reviewId, diaryId)
    private val onLogClick: ((Int) -> Unit)? = null,
    private val onLogFilm: ((DiaryEntry) -> Unit)? = null,
    private val onChangePoster: ((DiaryEntry) -> Unit)? = null
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
            binding.ivPoster.loadPoster(entry.movie.posterUrl, entry.movie.title)
            
            // Show rating stars
            binding.starRating.apply {
                displayMode = true
                starSizeDp = 10f
                starGapDp = 0f
                setColors(
                    ContextCompat.getColor(binding.root.context, R.color.star_green),
                    ContextCompat.getColor(binding.root.context, R.color.star_green_empty)
                )
            }
            binding.starRating.rating = entry.rating
            binding.starRating.visibility = if (entry.rating > 0f) View.VISIBLE else View.GONE
            
            // Show rewatch icon if rewatched
            binding.ivRewatch.visibility = if (entry.isRewatched) View.VISIBLE else View.GONE
            
            // Show review icon if has review
            binding.ivReview.visibility = if (entry.hasReview) View.VISIBLE else View.GONE
            
            // Click poster - if has review go to review detail, if log go to log detail, otherwise go to movie detail
            binding.ivPoster.setOnClickListener {
                if (entry.hasReview && entry.reviewId != null && entry.reviewId > 0) {
                    onReviewClick?.invoke(entry.reviewId, entry.id)
                } else if (entry.id > 0) {
                    // Log entry - navigate to diary detail with isLog=true
                    onLogClick?.invoke(entry.id)
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
                    },
                    onLogFilm = { onLogFilm?.invoke(entry) },
                    onChangePoster = { onChangePoster?.invoke(entry) }
                )
                true
            }
        }
    }
}
