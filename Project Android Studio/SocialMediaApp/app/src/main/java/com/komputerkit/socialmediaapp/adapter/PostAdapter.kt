package com.komputerkit.socialmediaapp.adapter

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.VideoView
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.util.ImageLoaderUtil
import com.komputerkit.socialmediaapp.util.MediaLoaderUtil
import com.komputerkit.socialmediaapp.util.VideoLoaderUtil
import com.komputerkit.socialmediaapp.util.VideoDebugUtil
import com.komputerkit.socialmediaapp.util.TextureVideoUtil
import com.komputerkit.socialmediaapp.util.HashtagUtil
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.User
import java.text.SimpleDateFormat
import java.util.*

class PostAdapter(
    private var posts: List<Post>,
    private val onLikeClick: (Post) -> Unit,
    private val onCommentClick: (Post) -> Unit,
    private val onShareClick: (Post) -> Unit,
    private val onSaveClick: (Post) -> Unit,
    private val onProfileClick: (String) -> Unit,
    private val onDeleteClick: (Post) -> Unit,
    private val getUserForPost: (String) -> LiveData<User?>,
    private val lifecycleOwner: LifecycleOwner,
    private val currentUserId: String
) : RecyclerView.Adapter<PostAdapter.PostViewHolder>() {

    inner class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val userProfileImage: ImageView = itemView.findViewById(R.id.userProfileImage)
        val userName: TextView = itemView.findViewById(R.id.userName)
        val postTime: TextView = itemView.findViewById(R.id.postTime)
        val moreOptions: ImageView = itemView.findViewById(R.id.moreOptions)
        val postImage: ImageView = itemView.findViewById(R.id.postImage)
        val postVideo: VideoView = itemView.findViewById(R.id.postVideo)
        val postVideoTexture: android.view.TextureView = itemView.findViewById(R.id.postVideoTexture)
        val videoPlayButton: ImageView = itemView.findViewById(R.id.videoPlayButton)
        val likeButton: ImageView = itemView.findViewById(R.id.likeButton)
        val commentButton: ImageView = itemView.findViewById(R.id.commentButton)
        val shareButton: ImageView = itemView.findViewById(R.id.shareButton)
        val saveButton: ImageView = itemView.findViewById(R.id.saveButton)
        val likesCountText: TextView = itemView.findViewById(R.id.likesCountText)
        val commentsCountText: TextView = itemView.findViewById(R.id.commentsCountText)
        val userNameInDesc: TextView = itemView.findViewById(R.id.userNameInDesc)
        val postDescription: TextView = itemView.findViewById(R.id.postDescription)
        val deleteButton: ImageView = itemView.findViewById(R.id.deleteButton)

        fun bind(post: Post) {
            Log.d("PostAdapter", "Binding post: ${post.id} - ${post.description}")
            
            // Lookup user data in real-time
            getUserForPost(post.userId).observe(lifecycleOwner) { user ->
                if (user != null) {
                    userName.text = user.username
                    userNameInDesc.text = user.username
                    
                    // Load user profile image with base64 prefix support
                    val imageUrl = if (user.profileImageUrl.startsWith("data:image")) {
                        user.profileImageUrl
                    } else if (user.profileImageUrl.isNotEmpty()) {
                        "data:image/jpeg;base64,${user.profileImageUrl}"
                    } else {
                        null
                    }
                    
                    Glide.with(itemView.context)
                        .load(imageUrl)
                        .placeholder(R.drawable.ic_launcher_foreground)
                        .error(R.drawable.ic_launcher_foreground)
                        .centerCrop()
                        .into(userProfileImage)
                        
                    // Handle profile click
                    userProfileImage.setOnClickListener {
                        onProfileClick(user.id)
                    }
                    userName.setOnClickListener {
                        onProfileClick(user.id)
                    }
                } else {
                    // Fallback for deleted/missing users
                    userName.text = "Unknown User"
                    userNameInDesc.text = "Unknown User"
                    userProfileImage.setImageResource(R.drawable.ic_launcher_foreground)
                }
            }
            
            // Setup description with clickable hashtags
            HashtagUtil.setupHashtagLinks(postDescription, post.description, itemView.context)
            
            // Update likes count next to heart icon
            likesCountText.text = post.likes.toString()
            
            // Update comments count next to comment icon  
            commentsCountText.text = post.commentsCount.toString()

            // Format timestamp
            postTime.text = formatTimestamp(post.timestamp)

            // Handle media display based on mediaType
            Log.d("PostAdapter", "Post mediaType: '${post.mediaType}'")
            Log.d("PostAdapter", "Post videoUrl length: ${post.videoUrl.length}")
            Log.d("PostAdapter", "Post videoUrl preview: ${post.videoUrl.take(50)}...")
            Log.d("PostAdapter", "Post postImageUrl: ${post.postImageUrl}")
            
            when (post.mediaType) {
                "video" -> {
                    Log.d("PostAdapter", "Processing video post")
                    // Show video, hide image
                    postImage.visibility = View.GONE
                    postVideo.visibility = View.VISIBLE
                    videoPlayButton.visibility = View.VISIBLE
                    
                    // Load video
                    val videoUrl = when {
                        post.videoUrl.isNotEmpty() -> {
                            Log.d("PostAdapter", "Using post.videoUrl")
                            post.videoUrl
                        }
                        post.postImageUrl.isNotEmpty() && post.postImageUrl.startsWith("http") -> {
                            Log.d("PostAdapter", "Using post.postImageUrl as fallback")
                            post.postImageUrl
                        }
                        else -> {
                            Log.w("PostAdapter", "No valid video URL found")
                            null
                        }
                    }
                    
                    if (videoUrl != null) {
                        Log.d("PostAdapter", "Loading video with URL length: ${videoUrl.length}")
                        
                        // Try VideoView first, then fallback to TextureView for better rendering
                        var loadSuccess = false
                        
                        if (videoUrl.startsWith("data:video/")) {
                            Log.d("PostAdapter", "Trying VideoView for base64 video")
                            loadSuccess = VideoLoaderUtil.loadVideoFromBase64(postVideo, videoUrl)
                            
                            if (!loadSuccess) {
                                Log.d("PostAdapter", "VideoView failed, trying TextureView")
                                // Hide VideoView and try TextureView
                                postVideo.visibility = View.GONE
                                loadSuccess = TextureVideoUtil.loadVideoWithTexture(postVideoTexture, videoUrl)
                            } else {
                                // Hide TextureView if VideoView succeeded
                                postVideoTexture.visibility = View.GONE
                            }
                        } else {
                            Log.d("PostAdapter", "Using MediaLoaderUtil for regular video")
                            MediaLoaderUtil.loadVideo(postVideo, videoUrl)
                            postVideoTexture.visibility = View.GONE
                            loadSuccess = true
                        }
                        
                        if (!loadSuccess) {
                            Log.w("PostAdapter", "Failed to load video, hiding video view")
                            postVideo.visibility = View.GONE
                            videoPlayButton.visibility = View.GONE
                        } else {
                            Log.d("PostAdapter", "Video loaded successfully, setting up UI")
                            
                            // Ensure proper visibility state
                            postImage.visibility = View.GONE
                            postVideo.visibility = View.VISIBLE
                            videoPlayButton.visibility = View.VISIBLE
                            
                            // Set black background for better video contrast
                            postVideo.setBackgroundColor(android.graphics.Color.BLACK)
                            
                            // Force VideoView to proper state
                            postVideo.requestLayout()
                            postVideo.invalidate()
                            postVideo.requestFocus()
                            
                            // Log final VideoView state
                            postVideo.post {
                                Log.d("PostAdapter", "VideoView final state - width: ${postVideo.width}, height: ${postVideo.height}")
                                Log.d("PostAdapter", "VideoView visibility: ${postVideo.visibility}")
                                
                                // Force layout if dimensions are invalid
                                if (postVideo.width <= 0 || postVideo.height <= 0) {
                                    Log.w("PostAdapter", "Invalid VideoView dimensions, forcing layout")
                                    val layoutParams = postVideo.layoutParams
                                    layoutParams.width = ViewGroup.LayoutParams.MATCH_PARENT
                                    layoutParams.height = 750 // Force height
                                    postVideo.layoutParams = layoutParams
                                    postVideo.requestLayout()
                                }
                                
                                VideoDebugUtil.showDebugToast(postVideo.context, 
                                    "VideoView UI: ${postVideo.width}x${postVideo.height}")
                            }
                        }
                        
                        // Setup video play button for both VideoView and TextureView
                        videoPlayButton.setOnClickListener {
                            var isPlaying = false
                            
                            // Check which video player is active
                            if (postVideo.visibility == View.VISIBLE) {
                                // VideoView is active
                                if (postVideo.isPlaying) {
                                    postVideo.pause()
                                    isPlaying = false
                                } else {
                                    postVideo.start()
                                    isPlaying = true
                                }
                            } else if (postVideoTexture.visibility == View.VISIBLE) {
                                // TextureView is active
                                isPlaying = TextureVideoUtil.togglePlayback(postVideoTexture)
                            }
                            
                            // Update play button visibility
                            videoPlayButton.visibility = if (isPlaying) View.GONE else View.VISIBLE
                        }
                        
                        // Handle video completion (only for VideoView, TextureView handled internally)
                        postVideo.setOnCompletionListener {
                            videoPlayButton.visibility = View.VISIBLE
                        }
                    } else {
                        Log.w("PostAdapter", "No video URL found, hiding all video views")
                        postVideo.visibility = View.GONE
                        postVideoTexture.visibility = View.GONE
                        videoPlayButton.visibility = View.GONE
                    }
                }
                "image", "" -> {
                    // Show image, hide all video views
                    postImage.visibility = View.VISIBLE
                    postVideo.visibility = View.GONE
                    postVideoTexture.visibility = View.GONE
                    videoPlayButton.visibility = View.GONE
                    
                    // Load post image: Prioritas imageUrl, lalu postImageUrl
                    val imageToLoad = when {
                        post.imageUrl.isNotEmpty() -> post.imageUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    ImageLoaderUtil.load(postImage, imageToLoad)
                }
                else -> {
                    // Unknown media type, try to load as image
                    postImage.visibility = View.VISIBLE
                    postVideo.visibility = View.GONE
                    postVideoTexture.visibility = View.GONE
                    videoPlayButton.visibility = View.GONE
                    
                    val mediaToLoad = when {
                        post.imageUrl.isNotEmpty() -> post.imageUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    ImageLoaderUtil.load(postImage, mediaToLoad)
                }
            }

            // Set like button state
            val isLiked = post.likedBy.contains(currentUserId)
            likeButton.setImageResource(
                if (isLiked) R.drawable.ic_heart_filled else R.drawable.ic_heart_outline
            )

            // Set click listeners
            likeButton.setOnClickListener {
                onLikeClick(post)
            }

            commentButton.setOnClickListener {
                onCommentClick(post)
            }

            shareButton.setOnClickListener {
                onShareClick(post)
            }

            saveButton.setOnClickListener {
                onSaveClick(post)
            }

            // Show/hide delete button based on post ownership
            if (post.userId == currentUserId) {
                deleteButton.visibility = View.VISIBLE
                deleteButton.setOnClickListener {
                    onDeleteClick(post)
                }
            } else {
                deleteButton.visibility = View.GONE
            }

            // Double tap to like
            postImage.setOnClickListener {
                if (!isLiked) {
                    onLikeClick(post)
                }
            }
        }

        private fun formatTimestamp(timestamp: Long): String {
            val now = System.currentTimeMillis()
            val diff = now - timestamp

            return when {
                diff < 60000 -> "Just now"
                diff < 3600000 -> "${diff / 60000}m"
                diff < 86400000 -> "${diff / 3600000}h"
                diff < 604800000 -> "${diff / 86400000}d"
                else -> {
                    val sdf = SimpleDateFormat("MMM dd", Locale.getDefault())
                    sdf.format(Date(timestamp))
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        Log.d("PostAdapter", "onCreateViewHolder called")
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_post, parent, false)
        return PostViewHolder(view)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        Log.d("PostAdapter", "onBindViewHolder called for position: $position")
        holder.bind(posts[position])
    }

    override fun getItemCount(): Int {
        Log.d("PostAdapter", "getItemCount called, returning: ${posts.size}")
        return posts.size
    }

    fun updatePosts(newPosts: List<Post>) {
        Log.d("PostAdapter", "Updating posts, new count: ${newPosts.size}")
        posts = newPosts
        notifyDataSetChanged()
        Log.d("PostAdapter", "Posts updated successfully")
    }

    fun updatePost(updatedPost: Post) {
        val position = posts.indexOfFirst { it.id == updatedPost.id }
        if (position != -1) {
            notifyItemChanged(position)
        }
    }
}
