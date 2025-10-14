package com.komputerkit.socialmediaapp.activity

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.recyclerview.widget.GridLayoutManager
import com.bumptech.glide.Glide
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.adapter.ProfileGridAdapter
import com.komputerkit.socialmediaapp.base.BaseActivity
import com.komputerkit.socialmediaapp.databinding.ActivityPostDetailBinding
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.fragment.CommentsBottomSheetFragment
import com.komputerkit.socialmediaapp.util.HashtagUtil
import com.komputerkit.socialmediaapp.util.ImageLoaderUtil
import com.komputerkit.socialmediaapp.util.MediaLoaderUtil
import com.komputerkit.socialmediaapp.util.VideoLoaderUtil

class PostDetailActivity : BaseActivity() {

    private lateinit var binding: ActivityPostDetailBinding
    private lateinit var otherPostsAdapter: ProfileGridAdapter
    
    private var userPostsListener: ListenerRegistration? = null
    private var currentPost: Post? = null
    private var profileUser: User? = null
    
    private var postId: String = ""
    private var userId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPostDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupRecyclerView()
        setupBottomNavigation()
        loadPostData()
    }

    private fun setupUI() {
        // firebaseRepository inherited from BaseActivity
        
        // Get post ID and user ID from intent
        postId = intent.getStringExtra("postId") ?: ""
        userId = intent.getStringExtra("userId") ?: ""
        
        Log.d("PostDetailActivity", "PostId: $postId, UserId: $userId")
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        binding.profileContainer.setOnClickListener {
            profileUser?.let { user ->
                if (user.id != currentUserId) {
                    val intent = android.content.Intent(this, ProfileActivity::class.java)
                    intent.putExtra("userId", user.id)
                    startActivity(intent)
                }
            }
        }
    }

    private fun setupRecyclerView() {
        otherPostsAdapter = ProfileGridAdapter(
            posts = emptyList(),
            onPostClick = { post ->
                // Navigate to another post detail
                val intent = android.content.Intent(this, PostDetailActivity::class.java)
                intent.putExtra("postId", post.id)
                intent.putExtra("userId", post.userId)
                startActivity(intent)
            },
            onPostLongClick = null // No delete in other posts view
        )
        
        binding.otherPostsRecyclerView.apply {
            layoutManager = GridLayoutManager(this@PostDetailActivity, 3)
            adapter = otherPostsAdapter
        }
    }

    private fun loadPostData() {
        showLoading(true)
        
        Log.d("PostDetailActivity", "loadPostData called - postId: $postId, userId: $userId")
        Log.d("PostDetailActivity", "currentUserId: $currentUserId")
        
        // Load specific post
        firebaseRepository.getPost(postId) { post ->
            runOnUiThread {
                if (post != null) {
                    Log.d("PostDetailActivity", "Post loaded successfully: ${post.id}")
                    currentPost = post
                    displayMainPost(post)
                    loadUserProfile(post.userId)
                    loadOtherUserPosts(post.userId)
                } else {
                    Log.e("PostDetailActivity", "Post not found for postId: $postId")
                    showToast("Post not found")
                    finish()
                }
            }
        }
    }

    private fun displayMainPost(post: Post) {
        Log.d("PostDetailActivity", "displayMainPost called for post: ${post.id}")
        Log.d("PostDetailActivity", "Post likes: ${post.likes}, likedBy: ${post.likedBy}")
        Log.d("PostDetailActivity", "Current user: $currentUserId")
        
        binding.apply {
            // Setup description with clickable hashtags
            HashtagUtil.setupHashtagLinks(postCaption, post.description, this@PostDetailActivity)
            
            postTimeText.text = formatTimestamp(post.timestamp)
            
            // Setup like button with current state
            val isLiked = post.likedBy.contains(currentUserId)
            Log.d("PostDetailActivity", "User is liked: $isLiked")
            
            updateLikeUI(isLiked, post.likedBy.size)
            
            // Handle media display based on post type
            when (post.mediaType) {
                "video" -> {
                    // Show video, hide image
                    mainPostImage.visibility = View.GONE
                    mainPostVideo.visibility = View.VISIBLE
                    videoPlayButton.visibility = View.VISIBLE
                    
                    // Load video
                    val videoUrl = when {
                        post.videoUrl.isNotEmpty() -> post.videoUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    
                    if (videoUrl != null) {
                        val loadSuccess = VideoLoaderUtil.loadVideoWithFallback(mainPostVideo, mainPostImage, videoUrl)
                        
                        if (loadSuccess) {
                            // Setup video play button
                            videoPlayButton.setOnClickListener {
                                if (mainPostVideo.isPlaying) {
                                    mainPostVideo.pause()
                                    videoPlayButton.visibility = View.VISIBLE
                                } else {
                                    mainPostVideo.start()
                                    videoPlayButton.visibility = View.GONE
                                }
                            }
                            
                            // Handle video completion
                            mainPostVideo.setOnCompletionListener {
                                videoPlayButton.visibility = View.VISIBLE
                            }
                        }
                    }
                }
                else -> {
                    // Show image, hide video
                    mainPostImage.visibility = View.VISIBLE
                    mainPostVideo.visibility = View.GONE
                    videoPlayButton.visibility = View.GONE
                    
                    // Load post image
                    val imageToLoad = when {
                        post.imageUrl.isNotEmpty() -> post.imageUrl
                        post.postImageUrl.isNotEmpty() -> post.postImageUrl
                        else -> null
                    }
                    
                    ImageLoaderUtil.load(mainPostImage, imageToLoad)
                }
            }
            
            likeButton.setOnClickListener {
                toggleLike()
            }
            
            commentButton.setOnClickListener {
                showCommentsBottomSheet()
            }
            
            shareButton.setOnClickListener {
                showToast("Share feature coming soon!")
            }
            
            // Show/hide delete button based on post ownership
            if (post.userId == currentUserId) {
                deleteMenuButton.visibility = View.VISIBLE
                deleteMenuButton.setOnClickListener {
                    showDeleteConfirmationDialog(post)
                }
            } else {
                deleteMenuButton.visibility = View.GONE
            }
        }
    }

    private fun showDeleteConfirmationDialog(post: Post) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Delete Post")
            .setMessage("Are you sure you want to delete this post? This action cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                deletePost(post)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun deletePost(post: Post) {
        showLoading(true)
        firebaseRepository.deletePost(post.id) { success ->
            runOnUiThread {
                showLoading(false)
                if (success) {
                    showToast("Post deleted successfully")
                    finish() // Close activity after successful deletion
                } else {
                    showToast("Failed to delete post. Please try again.")
                }
            }
        }
    }

    private fun loadUserProfile(userId: String) {
        firebaseRepository.getUser(userId) { user ->
            runOnUiThread {
                if (user != null) {
                    profileUser = user
                    displayUserProfile(user)
                }
            }
        }
    }

    private fun displayUserProfile(user: User) {
        binding.apply {
            usernameText.text = "@${user.username}"
            displayNameText.text = user.fullName.ifEmpty { user.displayName }
            
            verifiedIcon.visibility = if (user.isVerified) View.VISIBLE else View.GONE
            
            // Load profile image
            if (user.profileImageUrl.isNotEmpty()) {
                Glide.with(this@PostDetailActivity)
                    .load(user.profileImageUrl)
                    .placeholder(R.drawable.circle_background)
                    .error(R.drawable.circle_background)
                    .into(profileImage)
            }
        }
    }

    private fun loadOtherUserPosts(userId: String) {
        userPostsListener?.remove()
        userPostsListener = firebaseRepository.getUserPosts(userId) { posts ->
            runOnUiThread {
                // Filter out the current post and show other posts
                val otherPosts = posts.filter { it.id != postId }
                otherPostsAdapter.updatePosts(otherPosts)
                
                binding.otherPostsLabel.visibility = if (otherPosts.isNotEmpty()) View.VISIBLE else View.GONE
                binding.otherPostsRecyclerView.visibility = if (otherPosts.isNotEmpty()) View.VISIBLE else View.GONE
                
                showLoading(false)
            }
        }
    }

    private fun formatTimestamp(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        
        return when {
            diff < 60000 -> "just now"
            diff < 3600000 -> "${diff / 60000}m"
            diff < 86400000 -> "${diff / 3600000}h"
            diff < 604800000 -> "${diff / 86400000}d"
            else -> "${diff / 604800000}w"
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.mainContent.visibility = if (show) View.GONE else View.VISIBLE
    }

    private fun setupBottomNavigation() {
        setupBottomNavigation(0) // No specific menu item selected for post detail
    }
    
    private fun showCommentsBottomSheet() {
        val commentsBottomSheet = CommentsBottomSheetFragment.newInstance(postId)
        commentsBottomSheet.setOnProfileClickListener { userId ->
            if (userId != currentUserId) {
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("userId", userId)
                startActivity(intent)
            }
        }
        commentsBottomSheet.show(supportFragmentManager, "CommentsBottomSheet")
    }
    
    private fun toggleLike() {
        currentPost?.let { post ->
            Log.d("PostDetailActivity", "toggleLike called for post: ${post.id}")
            
            // Disable button temporarily to prevent double clicks
            binding.likeButton.isEnabled = false
            
            firebaseRepository.toggleLike(post.id, currentUserId) { success, isNowLiked ->
                runOnUiThread {
                    binding.likeButton.isEnabled = true
                    
                    if (success) {
                        Log.d("PostDetailActivity", "Like toggle successful, isNowLiked: $isNowLiked")
                        
                        // Update current post state
                        val updatedLikedBy = if (isNowLiked) {
                            post.likedBy + currentUserId
                        } else {
                            post.likedBy - currentUserId
                        }
                        
                        currentPost = post.copy(
                            likedBy = updatedLikedBy,
                            likes = updatedLikedBy.size.toLong()
                        )
                        
                        // Update UI immediately
                        updateLikeUI(isNowLiked, updatedLikedBy.size)
                        
                    } else {
                        Log.e("PostDetailActivity", "Failed to toggle like")
                        showToast("Failed to update like")
                    }
                }
            }
        }
    }
    
    private fun updateLikeUI(isLiked: Boolean, likesCount: Int) {
        binding.apply {
            // Update like button icon
            likeButton.setImageResource(
                if (isLiked) R.drawable.ic_heart_filled 
                else R.drawable.ic_heart
            )
            
            // Update likes count
            likesCountText.text = "$likesCount likes"
            
            Log.d("PostDetailActivity", "UI updated - isLiked: $isLiked, count: $likesCount")
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        userPostsListener?.remove()
    }
}
