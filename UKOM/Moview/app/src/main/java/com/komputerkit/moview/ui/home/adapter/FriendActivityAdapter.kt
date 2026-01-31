package com.komputerkit.moview.ui.home.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.loadAvatar

class FriendActivityAdapter(
    private val activities: List<FriendActivity>,
    private val onActivityClick: (FriendActivity) -> Unit,
    private val onMoreClick: (FriendActivity) -> Unit
) : RecyclerView.Adapter<FriendActivityAdapter.ActivityViewHolder>() {

    inner class ActivityViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val moviePoster: ImageView = view.findViewById(R.id.iv_movie_poster)
        val profilePhoto: ImageView = view.findViewById(R.id.iv_profile)
        val username: TextView = view.findViewById(R.id.tv_username)
        val rating: TextView = view.findViewById(R.id.tv_rating)
        val rewatchIcon: ImageView = view.findViewById(R.id.iv_rewatch)
        val moreIcon: ImageView = view.findViewById(R.id.iv_more)

        fun bind(activity: FriendActivity) {
            username.text = activity.user.username
            
            // Convert rating to stars (★★★★★)
            val stars = getStarsFromRating(activity.rating)
            rating.text = stars
            
            // Show/hide rewatch icon
            rewatchIcon.visibility = if (activity.isRewatch) View.VISIBLE else View.GONE
            
            // Show/hide more menu icon (only if has review)
            moreIcon.visibility = if (activity.hasReview) View.VISIBLE else View.GONE
            
            // Load movie poster with optimization
            moviePoster.loadThumbnail(activity.movie.posterUrl)
            
            // Load profile photo with optimization
            profilePhoto.loadAvatar(activity.user.profilePhotoUrl)
            
            itemView.setOnClickListener {
                onActivityClick(activity)
            }
            
            moreIcon.setOnClickListener {
                onMoreClick(activity)
            }
        }
        
        private fun getStarsFromRating(rating: Float): String {
            val fullStars = rating.toInt()
            val halfStar = if (rating - fullStars >= 0.5f) 1 else 0
            val emptyStars = 5 - fullStars - halfStar
            
            return "★".repeat(fullStars) + 
                   "½".repeat(halfStar).replace("½", "★") + 
                   "☆".repeat(emptyStars)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ActivityViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_friend_activity, parent, false)
        return ActivityViewHolder(view)
    }

    override fun onBindViewHolder(holder: ActivityViewHolder, position: Int) {
        holder.bind(activities[position])
    }

    override fun getItemCount(): Int = activities.size
}
