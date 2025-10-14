package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.UserStories

class UserStoriesAdapter(
    private var userStories: List<UserStories>,
    private val onUserStoryClick: (UserStories) -> Unit,
    private val onAddStoryClick: () -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val TYPE_ADD_STORY = 0
        private const val TYPE_USER_STORY = 1
    }

    override fun getItemViewType(position: Int): Int {
        return if (position == 0) TYPE_ADD_STORY else TYPE_USER_STORY
    }

    override fun getItemCount(): Int {
        return userStories.size + 1 // +1 for "Add Story" item
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return when (viewType) {
            TYPE_ADD_STORY -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_add_story, parent, false)
                AddStoryViewHolder(view)
            }
            TYPE_USER_STORY -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_story, parent, false)
                UserStoriesViewHolder(view)
            }
            else -> throw IllegalArgumentException("Unknown view type: $viewType")
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is AddStoryViewHolder -> {
                holder.bind()
            }
            is UserStoriesViewHolder -> {
                val userStory = userStories[position - 1] // -1 because first item is "Add Story"
                holder.bind(userStory)
            }
        }
    }

    inner class AddStoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        fun bind() {
            itemView.setOnClickListener {
                onAddStoryClick()
            }
        }
    }

    inner class UserStoriesViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val storyImage: ImageView = itemView.findViewById(R.id.storyImage)
        val profileImage: ImageView = itemView.findViewById(R.id.profileImage)
        val userName: TextView = itemView.findViewById(R.id.userName)
        val viewedIndicator: View = itemView.findViewById(R.id.viewedIndicator)
        val storyBorder: View = itemView.findViewById(R.id.storyBorder)

        fun bind(userStory: UserStories) {
            userName.text = userStory.userName

            // Load latest story image as background
            Glide.with(itemView.context)
                .load(userStory.latestStoryImage)
                .placeholder(R.drawable.ic_launcher_foreground)
                .error(R.drawable.ic_launcher_foreground)
                .centerCrop()
                .into(storyImage)

            // Load profile image
            Glide.with(itemView.context)
                .load(userStory.userProfileImage)
                .placeholder(R.drawable.ic_launcher_foreground)
                .error(R.drawable.ic_launcher_foreground)
                .centerCrop()
                .into(profileImage)

            // Show unviewed indicator and border
            if (userStory.hasUnviewedStories) {
                viewedIndicator.visibility = View.GONE
                storyBorder.alpha = 1.0f // Bright border for unviewed
            } else {
                viewedIndicator.visibility = View.VISIBLE
                storyBorder.alpha = 0.5f // Dimmed border for viewed
            }

            // Set click listener
            itemView.setOnClickListener {
                onUserStoryClick(userStory)
            }
        }
    }

    fun updateUserStories(newUserStories: List<UserStories>) {
        userStories = newUserStories
        notifyDataSetChanged()
    }

    fun markUserStoriesAsViewed(userId: String) {
        val position = userStories.indexOfFirst { it.userId == userId }
        if (position != -1) {
            notifyItemChanged(position + 1) // +1 because first item is "Add Story"
        }
    }
}
