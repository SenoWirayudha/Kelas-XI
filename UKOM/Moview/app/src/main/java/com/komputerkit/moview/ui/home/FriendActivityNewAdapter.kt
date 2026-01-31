package com.komputerkit.moview.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.databinding.ItemFriendActivityNewBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.loadAvatar
import kotlin.math.roundToInt

class FriendActivityNewAdapter(
    private val onActivityClick: (FriendActivity) -> Unit = {},
    private val onLongPressGoToFilm: ((FriendActivity) -> Unit)? = null
) : RecyclerView.Adapter<FriendActivityNewAdapter.FriendActivityViewHolder>() {
    
    private var activities: List<FriendActivity> = emptyList()
    
    fun submitList(list: List<FriendActivity>) {
        activities = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FriendActivityViewHolder {
        val binding = ItemFriendActivityNewBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FriendActivityViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: FriendActivityViewHolder, position: Int) {
        holder.bind(activities[position])
    }
    
    override fun getItemCount(): Int = activities.size
    
    inner class FriendActivityViewHolder(
        private val binding: ItemFriendActivityNewBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(activity: FriendActivity) {
            // Movie poster with optimization
            binding.ivPoster.loadThumbnail(activity.movie.posterUrl)
            
            // User profile photo with optimization
            binding.ivUserPhoto.loadAvatar(activity.user.profilePhotoUrl)
            
            // User name
            binding.tvUserName.text = activity.user.username
            
            // Rating stars
            binding.tvRating.text = getStarsFromRating(activity.rating)
            
            // Show review icon if activity has review
            binding.icHasReview.visibility = if (activity.hasReview) View.VISIBLE else View.GONE
            
            // Handle click
            binding.root.setOnClickListener {
                onActivityClick(activity)
            }
            
            // Long press on poster to show movie actions
            binding.ivPoster.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = activity.movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { movie -> onLongPressGoToFilm?.invoke(activity) }
                )
                true
            }
        }
        
        private fun getStarsFromRating(rating: Float): String {
            val fullStars = rating.roundToInt()
            return "★".repeat(fullStars.coerceIn(0, 5))
        }
    }
}
