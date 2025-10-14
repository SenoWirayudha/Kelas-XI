package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.util.ImageLoaderUtil
import com.komputerkit.socialmediaapp.util.VideoLoaderUtil

class ProfilePostsAdapter(
    private var posts: List<Post>,
    private val onPostClick: (Post) -> Unit
) : RecyclerView.Adapter<ProfilePostsAdapter.PostViewHolder>() {

    inner class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val postImage: ImageView = itemView.findViewById(R.id.postImage)

        fun bind(post: Post) {
            // Handle both image and video posts
            when (post.mediaType) {
                "video" -> {
                    // For grid view, show video thumbnail instead of actual video
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
                            // Fallback to default image
                            postImage.setImageResource(R.drawable.ic_launcher_foreground)
                        }
                    } else {
                        // Regular video URL or fallback
                        Glide.with(itemView.context)
                            .load(videoUrl)
                            .placeholder(R.drawable.ic_launcher_foreground)
                            .error(R.drawable.ic_launcher_foreground)
                            .centerCrop()
                            .into(postImage)
                    }
                }
                else -> {
                    // Handle images (existing logic but improved)
                    val imageToLoad = when {
                        post.imageUrl.isNotEmpty() -> post.imageUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    ImageLoaderUtil.load(postImage, imageToLoad)
                }
            }

            itemView.setOnClickListener {
                onPostClick(post)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_profile_post, parent, false)
        return PostViewHolder(view)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        holder.bind(posts[position])
    }

    override fun getItemCount(): Int = posts.size

    fun updatePosts(newPosts: List<Post>) {
        posts = newPosts
        notifyDataSetChanged()
    }
}
