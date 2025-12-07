package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.Story

class StoryAdapter(
    private var stories: List<Story>,
    private val onStoryClick: (Story) -> Unit
) : RecyclerView.Adapter<StoryAdapter.StoryViewHolder>() {

    inner class StoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val storyImage: ImageView = itemView.findViewById(R.id.storyImage)
        val profileImage: ImageView = itemView.findViewById(R.id.profileImage)
        val userName: TextView = itemView.findViewById(R.id.userName)
        val viewedIndicator: View = itemView.findViewById(R.id.viewedIndicator)
        val storyBorder: View = itemView.findViewById(R.id.storyBorder)

        fun bind(story: Story) {
            userName.text = story.userName

            // Smart image loading logic untuk support URL, base64, dan placeholder
            val imageToLoad = when {
                // Prioritas 1: Jika imageUrl berisi URL link, gunakan itu
                story.imageUrl.isNotEmpty() && (story.imageUrl.startsWith("http://") || story.imageUrl.startsWith("https://")) -> {
                    story.imageUrl
                }
                // Prioritas 2: Jika mainImageUrl ada (biasanya base64 data URI)
                story.mainImageUrl.isNotEmpty() -> {
                    story.mainImageUrl
                }
                // Prioritas 3: Jika storyImageUrl ada (fallback)
                story.storyImageUrl.isNotEmpty() -> {
                    story.storyImageUrl
                }
                // Fallback: kosong untuk placeholder
                else -> null
            }

            // Load story image dengan Glide
            Glide.with(itemView.context)
                .load(imageToLoad) // Bisa URL link atau base64 data URI
                .placeholder(R.drawable.ic_launcher_foreground)
                .error(R.drawable.ic_launcher_foreground)
                .centerCrop()
                .into(storyImage)

            // Load profile image
            Glide.with(itemView.context)
                .load(story.userProfileImage)
                .placeholder(R.drawable.ic_launcher_foreground)
                .error(R.drawable.ic_launcher_foreground)
                .centerCrop()
                .into(profileImage)

            // Show/hide viewed indicator and story border
            if (story.viewed) {
                viewedIndicator.visibility = View.VISIBLE
                storyBorder.alpha = 0.5f
            } else {
                viewedIndicator.visibility = View.GONE
                storyBorder.alpha = 1.0f
            }

            // Set click listener
            itemView.setOnClickListener {
                onStoryClick(story)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_story, parent, false)
        return StoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: StoryViewHolder, position: Int) {
        holder.bind(stories[position])
    }

    override fun getItemCount(): Int = stories.size

    fun updateStories(newStories: List<Story>) {
        stories = newStories
        notifyDataSetChanged()
    }

    fun markStoryAsViewed(storyId: String) {
        val position = stories.indexOfFirst { it.id == storyId }
        if (position != -1) {
            notifyItemChanged(position)
        }
    }
}
