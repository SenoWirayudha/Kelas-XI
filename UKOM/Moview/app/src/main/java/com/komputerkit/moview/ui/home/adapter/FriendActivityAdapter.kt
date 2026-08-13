package com.komputerkit.moview.ui.home.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import androidx.core.content.ContextCompat
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
        val starRating: com.komputerkit.moview.ui.common.StarRatingView = view.findViewById(R.id.star_rating)
        val rewatchIcon: ImageView = view.findViewById(R.id.iv_rewatch)
        val moreIcon: ImageView = view.findViewById(R.id.iv_more)

        fun bind(activity: FriendActivity) {
            username.text = activity.user.username

            // Convert rating to stars (★★★★★)
            starRating.apply {
                starSizeDp = 14f
                starGapDp = 0f
                setColors(
                    ContextCompat.getColor(itemView.context, R.color.star_green),
                    ContextCompat.getColor(itemView.context, R.color.star_green_empty)
                )
            }
            starRating.rating = activity.rating
            starRating.visibility = if (activity.rating > 0f) View.VISIBLE else View.GONE

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
