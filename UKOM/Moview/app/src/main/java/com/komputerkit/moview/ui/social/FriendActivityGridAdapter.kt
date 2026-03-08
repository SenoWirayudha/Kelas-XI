package com.komputerkit.moview.ui.social

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.databinding.ItemFriendActivityGridBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.loadAvatar
import kotlin.math.roundToInt

class FriendActivityGridAdapter(
    private val onActivityClick: (FriendActivity) -> Unit = {},
    private val onProfileClick: (FriendActivity) -> Unit = {},
    private val onGoToFilm: ((FriendActivity) -> Unit)? = null,
    private val onLogFilm: ((FriendActivity) -> Unit)? = null,
    private val onChangePoster: ((FriendActivity) -> Unit)? = null
) : RecyclerView.Adapter<FriendActivityGridAdapter.FriendActivityViewHolder>() {
    
    private var activities: List<FriendActivity> = emptyList()
    
    fun submitList(list: List<FriendActivity>) {
        activities = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FriendActivityViewHolder {
        val binding = ItemFriendActivityGridBinding.inflate(
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
        private val binding: ItemFriendActivityGridBinding
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
            
            // Show rewatch icon if activity is rewatch
            binding.ivRewatch.visibility = if (activity.isRewatch) View.VISIBLE else View.GONE
            
            // Handle click on profile photo or username → go to user profile
            binding.ivUserPhoto.setOnClickListener { onProfileClick(activity) }
            binding.tvUserName.setOnClickListener { onProfileClick(activity) }

            // Handle click on poster
            binding.ivPoster.setOnClickListener {
                android.util.Log.d("FriendActivityGridAdapter", "Activity clicked: ${activity.id}")
                onActivityClick(activity)
            }
            
            // Long press on poster to show movie actions
            binding.ivPoster.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = activity.movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { movie -> (onGoToFilm ?: { onActivityClick(activity) }).invoke(activity) },
                    onLogFilm = { onLogFilm?.invoke(activity) },
                    onChangePoster = { onChangePoster?.invoke(activity) }
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
