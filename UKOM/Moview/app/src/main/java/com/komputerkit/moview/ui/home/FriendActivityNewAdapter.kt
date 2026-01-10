package com.komputerkit.moview.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.databinding.ItemFriendActivityNewBinding
import kotlin.math.roundToInt

class FriendActivityNewAdapter(
    private val onActivityClick: (FriendActivity) -> Unit = {}
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
            // Movie poster
            Glide.with(binding.root.context)
                .load(activity.movie.posterUrl)
                .into(binding.ivPoster)
            
            // User profile photo
            Glide.with(binding.root.context)
                .load(activity.user.profilePhotoUrl)
                .circleCrop()
                .into(binding.ivUserPhoto)
            
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
        }
        
        private fun getStarsFromRating(rating: Float): String {
            val fullStars = rating.roundToInt()
            return "★".repeat(fullStars.coerceIn(0, 5))
        }
    }
}
