package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.util.Log
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.util.ImageLoaderUtil
import com.komputerkit.socialmediaapp.util.VideoLoaderUtil

class SearchAdapter(
    private var users: List<User>,
    private var posts: List<Post>,
    private val onUserClick: (User) -> Unit,
    private val onPostClick: (Post) -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val TYPE_USER = 0
        private const val TYPE_POST = 1
    }

    inner class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profileImage: ImageView = itemView.findViewById(R.id.profileImage)
        val username: TextView = itemView.findViewById(R.id.username)
        val displayName: TextView = itemView.findViewById(R.id.displayName)
        val followersCount: TextView = itemView.findViewById(R.id.followersCount)
        val verifiedIcon: ImageView = itemView.findViewById(R.id.verifiedIcon)

        fun bind(user: User) {
            username.text = "@${user.username}"
            displayName.text = user.displayName
            followersCount.text = "${user.followers.size} followers"
            
            verifiedIcon.visibility = if (user.isVerified) View.VISIBLE else View.GONE

            Glide.with(itemView.context)
                .load(user.profileImageUrl)
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
                .centerCrop()
                .into(profileImage)

            itemView.setOnClickListener {
                Log.d("SearchAdapter", "User clicked: ${user.username} with ID: ${user.id}")
                onUserClick(user)
            }
        }
    }

    inner class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val postImage: ImageView = itemView.findViewById(R.id.postImage)
        val userProfileImage: ImageView = itemView.findViewById(R.id.userProfileImage)
        val username: TextView = itemView.findViewById(R.id.username)
        val description: TextView = itemView.findViewById(R.id.description)
        val likesCount: TextView = itemView.findViewById(R.id.likesCount)

        fun bind(post: Post) {
            username.text = post.userName
            description.text = post.description
            likesCount.text = "${post.likes} likes"

            // Load user profile image with base64 support
            val profileImageUrl = if (post.userProfileImage.startsWith("data:image")) {
                post.userProfileImage
            } else if (post.userProfileImage.isNotEmpty()) {
                "data:image/jpeg;base64,${post.userProfileImage}"
            } else {
                null
            }
            
            Glide.with(itemView.context)
                .load(profileImageUrl)
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
                .centerCrop()
                .into(userProfileImage)

            // Load post media based on media type (image or video)
            when (post.mediaType) {
                "video" -> {
                    // For search results, show video thumbnail
                    val videoUrl = when {
                        post.videoUrl.isNotEmpty() -> post.videoUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    
                    if (videoUrl != null && videoUrl.startsWith("data:video/")) {
                        // Generate thumbnail for base64 video
                        val thumbnail = VideoLoaderUtil.generateThumbnailFromBase64(itemView.context, videoUrl)
                        if (thumbnail != null) {
                            postImage.setImageBitmap(thumbnail)
                        } else {
                            postImage.setImageResource(R.drawable.ic_launcher_foreground)
                        }
                    } else {
                        // Regular video URL
                        Glide.with(itemView.context)
                            .load(videoUrl)
                            .placeholder(R.drawable.ic_launcher_foreground)
                            .error(R.drawable.ic_launcher_foreground)
                            .centerCrop()
                            .into(postImage)
                    }
                }
                else -> {
                    // Handle images
                    val postImageUrl = when {
                        post.imageUrl.isNotEmpty() -> post.imageUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    ImageLoaderUtil.load(postImage, postImageUrl)
                }
            }

            itemView.setOnClickListener {
                onPostClick(post)
            }
        }
    }

    override fun getItemViewType(position: Int): Int {
        return if (position < users.size) TYPE_USER else TYPE_POST
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return when (viewType) {
            TYPE_USER -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_search_user, parent, false)
                UserViewHolder(view)
            }
            TYPE_POST -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_search_post, parent, false)
                PostViewHolder(view)
            }
            else -> throw IllegalArgumentException("Invalid view type")
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is UserViewHolder -> {
                holder.bind(users[position])
            }
            is PostViewHolder -> {
                val postPosition = position - users.size
                holder.bind(posts[postPosition])
            }
        }
    }

    override fun getItemCount(): Int = users.size + posts.size

    fun updateResults(newUsers: List<User>, newPosts: List<Post>) {
        users = newUsers
        posts = newPosts
        notifyDataSetChanged()
    }
}
