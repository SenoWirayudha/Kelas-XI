package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

class UserListAdapter(
    private var users: List<User>,
    private val currentUserId: String,
    private val onUserClick: (User) -> Unit,
    private val onFollowClick: (User, Boolean) -> Unit
) : RecyclerView.Adapter<UserListAdapter.UserViewHolder>() {

    private val firebaseRepository = FirebaseRepository()
    private val followingStatusMap = mutableMapOf<String, Boolean>()

    inner class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profileImage: ImageView = itemView.findViewById(R.id.profileImage)
        val userName: TextView = itemView.findViewById(R.id.userName)
        val userUsername: TextView = itemView.findViewById(R.id.userUsername)
        val followButton: Button = itemView.findViewById(R.id.followButton)

        fun bind(user: User) {
            userName.text = user.fullName.ifEmpty { user.displayName }
            userUsername.text = "@${user.username}"

            // Load profile image
            Glide.with(itemView.context)
                .load(user.profileImageUrl)
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
                .circleCrop()
                .into(profileImage)

            // Hide follow button if it's the current user
            if (user.id == currentUserId) {
                followButton.visibility = View.GONE
            } else {
                followButton.visibility = View.VISIBLE
                
                // Check if current user is following this user
                checkFollowingStatus(user)
            }

            // Set click listeners
            itemView.setOnClickListener {
                onUserClick(user)
            }

            followButton.setOnClickListener {
                val isCurrentlyFollowing = followingStatusMap[user.id] ?: false
                onFollowClick(user, isCurrentlyFollowing)
            }
        }

        private fun checkFollowingStatus(user: User) {
            firebaseRepository.isFollowing(currentUserId, user.id) { isFollowing ->
                followingStatusMap[user.id] = isFollowing
                itemView.post {
                    updateFollowButton(user.id, isFollowing)
                }
            }
        }

        private fun updateFollowButton(userId: String, isFollowing: Boolean) {
            if (users.any { it.id == userId }) {
                followButton.text = if (isFollowing) "Unfollow" else "Follow"
                followButton.setBackgroundColor(
                    if (isFollowing) 
                        itemView.context.getColor(android.R.color.darker_gray)
                    else 
                        itemView.context.getColor(R.color.primary_color)
                )
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_user_list, parent, false)
        return UserViewHolder(view)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        holder.bind(users[position])
    }

    override fun getItemCount(): Int = users.size

    fun updateUsers(newUsers: List<User>) {
        users = newUsers
        notifyDataSetChanged()
    }

    fun updateFollowStatus(userId: String, isFollowing: Boolean) {
        followingStatusMap[userId] = isFollowing
        val position = users.indexOfFirst { it.id == userId }
        if (position != -1) {
            notifyItemChanged(position)
        }
    }
}