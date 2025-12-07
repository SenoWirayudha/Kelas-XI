package com.komputerkit.socialmediaapp.activity

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.recyclerview.widget.GridLayoutManager
import com.bumptech.glide.Glide
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.MainActivity
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.activity.CreatePostActivity
import com.komputerkit.socialmediaapp.activity.EditProfileActivity
import com.komputerkit.socialmediaapp.activity.FollowersFollowingActivity
import com.komputerkit.socialmediaapp.activity.NotificationActivity
import com.komputerkit.socialmediaapp.activity.SearchActivity
import com.komputerkit.socialmediaapp.adapter.ProfileGridAdapter
import com.komputerkit.socialmediaapp.base.BaseActivity
import com.komputerkit.socialmediaapp.databinding.ActivityProfileBinding
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

class ProfileActivity : BaseActivity() {

    private lateinit var binding: ActivityProfileBinding
    private lateinit var profilePostsAdapter: ProfileGridAdapter
    
    private var userPostsListener: ListenerRegistration? = null
    private var profileUserListener: ListenerRegistration? = null
    private var currentUserListener: ListenerRegistration? = null
    private var currentUser: User? = null
    private var profileUser: User? = null
    
    private var profileUserId: String = ""
    private var isOwnProfile = false
    
    // Activity Result Launcher for EditProfileActivity
    private val editProfileLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            // Profile updated, data will auto refresh via Firestore listeners
            showToast("Profil berhasil diperbarui")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupRecyclerView()
        setupBottomNavigation(R.id.nav_profile)
        setupCustomBottomNavigation()
        loadUserData()
    }

    override fun onResume() {
        super.onResume()
        // Refresh user data when returning to this activity
        if (!isOwnProfile) {
            Log.d("ProfileActivity", "onResume - refreshing user data for follow button")
            refreshCurrentUserData()
        }
    }

    private fun refreshCurrentUserData() {
        firebaseRepository.getUser(currentUserId) { user ->
            runOnUiThread {
                currentUser = user
                Log.d("ProfileActivity", "Current user refreshed: ${user?.username}")
                updateFollowButtonState()
            }
        }
    }

    private fun setupCustomBottomNavigation() {
        // Override profile navigation to handle viewing own profile from another user's profile
        bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    Log.d("ProfileActivity", "Navigating to MainActivity")
                    val intent = Intent(this, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                    startActivity(intent)
                    true
                }
                R.id.nav_search -> {
                    Log.d("ProfileActivity", "Navigating to SearchActivity")
                    val intent = Intent(this, SearchActivity::class.java)
                    startActivity(intent)
                    true
                }
                R.id.nav_add -> {
                    Log.d("ProfileActivity", "Navigating to CreatePostActivity")
                    val intent = Intent(this, CreatePostActivity::class.java)
                    startActivity(intent)
                    true
                }
                R.id.nav_notifications -> {
                    Log.d("ProfileActivity", "Navigating to NotificationActivity")
                    val intent = Intent(this, NotificationActivity::class.java)
                    startActivity(intent)
                    true
                }
                R.id.nav_profile -> {
                    // Always navigate to own profile, even if currently viewing someone else's
                    Log.d("ProfileActivity", "Navigating to own profile - current: $profileUserId, own: $currentUserId")
                    if (profileUserId != currentUserId) {
                        val intent = Intent(this, ProfileActivity::class.java)
                        intent.putExtra("userId", currentUserId)
                        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                        startActivity(intent)
                        finish()
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun setupUI() {
        // firebaseRepository inherited from BaseActivity
        
        // Get user ID from intent (if viewing another user's profile)
        profileUserId = intent.getStringExtra("userId") ?: currentUserId
        isOwnProfile = profileUserId == currentUserId
        
        Log.d("ProfileActivity", "Profile setup - profileUserId: $profileUserId, currentUserId: $currentUserId, isOwnProfile: $isOwnProfile")
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        // Setup buttons based on profile type
        if (isOwnProfile) {
            binding.followButton.visibility = View.GONE
            binding.editProfileButton.visibility = View.VISIBLE
            binding.editProfileButton.setOnClickListener {
                val intent = Intent(this, EditProfileActivity::class.java)
                editProfileLauncher.launch(intent)
            }
            
            // Show menu for own profile
            binding.toolbar.inflateMenu(R.menu.profile_menu)
            binding.toolbar.setOnMenuItemClickListener { menuItem ->
                when (menuItem.itemId) {
                    R.id.action_logout -> {
                        logout()
                        true
                    }
                    else -> false
                }
            }
        } else {
            binding.followButton.visibility = View.VISIBLE
            binding.editProfileButton.visibility = View.GONE
            setupFollowButton()
        }

        // Setup click listeners for followers and following counts
        setupFollowersFollowingClickListeners()
    }

    private fun setupRecyclerView() {
        val onPostLongClick: ((Post) -> Unit)? = if (profileUserId == currentUserId) {
            { post -> showDeleteConfirmationDialog(post) }
        } else {
            null
        }
        
        profilePostsAdapter = ProfileGridAdapter(
            posts = emptyList(),
            onPostClick = { post ->
                // Navigate to post detail
                val intent = Intent(this, PostDetailActivity::class.java)
                intent.putExtra("postId", post.id)
                intent.putExtra("userId", post.userId)
                startActivity(intent)
            },
            onPostLongClick = onPostLongClick
        )
        
        binding.postsRecyclerView.apply {
            layoutManager = GridLayoutManager(this@ProfileActivity, 3)
            adapter = profilePostsAdapter
        }
    }

    private fun setupFollowersFollowingClickListeners() {
        // Followers click listener
        binding.followersContainer.setOnClickListener {
            openFollowersFollowingActivity(FollowersFollowingActivity.TYPE_FOLLOWERS)
        }
        
        // Following click listener  
        binding.followingContainer.setOnClickListener {
            openFollowersFollowingActivity(FollowersFollowingActivity.TYPE_FOLLOWING)
        }
    }

    private fun openFollowersFollowingActivity(listType: String) {
        val intent = Intent(this, FollowersFollowingActivity::class.java)
        intent.putExtra(FollowersFollowingActivity.EXTRA_USER_ID, profileUserId)
        intent.putExtra(FollowersFollowingActivity.EXTRA_LIST_TYPE, listType)
        startActivity(intent)
    }

    private fun loadUserData() {
        showLoading(true)
        
        // Sync follow counters first to fix any corruption
        firebaseRepository.syncFollowCounters { success ->
            Log.d("ProfileActivity", "Follow counters sync result: $success")
        }
        
        var currentUserLoaded = false
        var profileUserLoaded = false
        
        // Remove existing listeners
        currentUserListener?.remove()
        profileUserListener?.remove()
        
        // Setup realtime listener for current user
        currentUserListener = firebaseRepository.getUserRealTime(currentUserId) { user ->
            runOnUiThread {
                currentUser = user
                currentUserLoaded = true
                Log.d("ProfileActivity", "Current user updated: ${user?.username}")
                
                // Update follow button if both users are loaded
                if (currentUserLoaded && profileUserLoaded && !isOwnProfile) {
                    updateFollowButtonState()
                }
            }
        }
        
        // Setup realtime listener for profile user
        profileUserListener = firebaseRepository.getUserRealTime(profileUserId) { user ->
            runOnUiThread {
                if (user != null) {
                    profileUser = user
                    profileUserLoaded = true
                    displayUserData(user)
                    
                    // Update follow button if both users are loaded
                    if (currentUserLoaded && profileUserLoaded && !isOwnProfile) {
                        updateFollowButtonState()
                    }
                } else {
                    showToast("User not found")
                    finish()
                }
                showLoading(false)
            }
        }
        
        // Load user posts
        loadUserPosts()
    }

    private fun displayUserData(user: User) {
        Log.d("ProfileActivity", "Displaying user data for: ${user.username}, displayName: ${user.displayName}")
        Log.d("ProfileActivity", "User followers: ${user.followers.size}, followersCount: ${user.followersCount}")
        Log.d("ProfileActivity", "User following: ${user.following.size}, followingCount: ${user.followingCount}")
        
        binding.apply {
            usernameText.text = "@${user.username}"
            displayNameText.text = user.fullName.ifEmpty { user.displayName }
            bioText.text = user.bio
            postsCountText.text = user.postsCount.toString()
            followersCountText.text = user.followersCount.toString()
            followingCountText.text = user.followingCount.toString()
            
            verifiedIcon.visibility = if (user.isVerified) View.VISIBLE else View.GONE
            
            // Load profile image
            if (user.profileImageUrl.isNotEmpty()) {
                Glide.with(this@ProfileActivity)
                    .load(user.profileImageUrl)
                    .circleCrop()
                    .into(profileImage)
            }
        }
        
        showLoading(false)
    }

    private fun loadUserPosts() {
        Log.d("ProfileActivity", "Loading posts for user: $profileUserId")
        
        // Debug: Get all posts to see what's available
        firebaseRepository.getAllPosts { allPosts ->
            Log.d("ProfileActivity", "DEBUG: All posts in Firestore:")
            allPosts.forEach { post ->
                Log.d("ProfileActivity", "  - Post ${post.id}: userId=${post.userId}, userName=${post.userName}")
            }
            
            // Filter posts for current user
            val userPosts = allPosts.filter { it.userId == profileUserId }
            Log.d("ProfileActivity", "DEBUG: Filtered posts for user $profileUserId: ${userPosts.size}")
            userPosts.forEach { post ->
                Log.d("ProfileActivity", "  - User post: ${post.id}, image: ${post.postImageUrl}")
            }
            
            runOnUiThread {
                Log.d("ProfileActivity", "Updating UI with ${userPosts.size} posts")
                profilePostsAdapter.updatePosts(userPosts)
                
                // Update visibility based on posts count
                if (userPosts.isNotEmpty()) {
                    Log.d("ProfileActivity", "Hiding 'no posts' text - found ${userPosts.size} posts")
                    binding.noPostsText.visibility = View.GONE
                } else {
                    Log.d("ProfileActivity", "Showing 'no posts' text - no posts found")
                    binding.noPostsText.visibility = View.VISIBLE
                }
                
                // Update posts count in UI
                binding.postsCountText.text = userPosts.size.toString()
            }
        }
        
        // Remove the real-time listener approach to avoid conflicts
        userPostsListener?.remove()
    }

    private fun setupFollowButton() {
        binding.followButton.setOnClickListener {
            Log.d("ProfileActivity", "Follow button clicked")
            profileUser?.let { user ->
                currentUser?.let { current ->
                    val isFollowing = current.following.contains(profileUserId)
                    Log.d("ProfileActivity", "Current following status: $isFollowing for user: ${user.username}")
                    
                    if (isFollowing) {
                        unfollowUser()
                    } else {
                        followUser()
                    }
                } ?: run {
                    Log.e("ProfileActivity", "Current user is null!")
                    showToast("Unable to follow user")
                }
            } ?: run {
                Log.e("ProfileActivity", "Profile user is null!")
                showToast("Unable to follow user")
            }
        }
        
        updateFollowButtonState()
    }

    private fun followUser() {
        Log.d("ProfileActivity", "Following user: $profileUserId")
        binding.followButton.isEnabled = false
        
        firebaseRepository.followUser(currentUserId, profileUserId) { success ->
            runOnUiThread {
                binding.followButton.isEnabled = true
                if (success) {
                    Log.d("ProfileActivity", "Successfully followed user")
                    // Reload current user data to get updated following list
                    firebaseRepository.getUser(currentUserId) { user ->
                        runOnUiThread {
                            currentUser = user
                            updateFollowButtonState()
                        }
                    }
                    // Reload profile user data to get updated followers count
                    firebaseRepository.getUser(profileUserId) { user ->
                        runOnUiThread {
                            if (user != null) {
                                profileUser = user
                                binding.followersCountText.text = user.followersCount.toString()
                            }
                        }
                    }
                    showToast("Following ${profileUser?.username}")
                } else {
                    Log.e("ProfileActivity", "Failed to follow user")
                    showToast("Failed to follow user")
                }
            }
        }
    }

    private fun unfollowUser() {
        Log.d("ProfileActivity", "Unfollowing user: $profileUserId")
        binding.followButton.isEnabled = false
        
        firebaseRepository.unfollowUser(currentUserId, profileUserId) { success ->
            runOnUiThread {
                binding.followButton.isEnabled = true
                if (success) {
                    Log.d("ProfileActivity", "Successfully unfollowed user")
                    // Reload current user data to get updated following list
                    firebaseRepository.getUser(currentUserId) { user ->
                        runOnUiThread {
                            currentUser = user
                            updateFollowButtonState()
                        }
                    }
                    // Reload profile user data to get updated followers count
                    firebaseRepository.getUser(profileUserId) { user ->
                        runOnUiThread {
                            if (user != null) {
                                profileUser = user
                                binding.followersCountText.text = user.followersCount.toString()
                            }
                        }
                    }
                    showToast("Unfollowed ${profileUser?.username}")
                } else {
                    Log.e("ProfileActivity", "Failed to unfollow user")
                    showToast("Failed to unfollow user")
                }
            }
        }
    }

    private fun updateFollowButtonState() {
        currentUser?.let { current ->
            val isFollowing = current.following.contains(profileUserId)
            Log.d("ProfileActivity", "Updating follow button state:")
            Log.d("ProfileActivity", "- currentUser: ${current.username}")
            Log.d("ProfileActivity", "- profileUserId: $profileUserId")
            Log.d("ProfileActivity", "- following list: ${current.following}")
            Log.d("ProfileActivity", "- isFollowing: $isFollowing")
            
            binding.followButton.apply {
                text = if (isFollowing) "Unfollow" else "Follow"
                setBackgroundColor(
                    if (isFollowing) 
                        getColor(R.color.unfollow_button_color) 
                    else 
                        getColor(R.color.follow_button_color)
                )
            }
        } ?: run {
            Log.e("ProfileActivity", "Cannot update follow button state - currentUser is null")
        }
    }

    private fun updateFollowersCount() {
        profileUser?.let { user ->
            binding.followersCountText.text = user.followersCount.toString()
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
                    // Posts will be automatically updated via real-time listener
                } else {
                    showToast("Failed to delete post. Please try again.")
                }
            }
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.contentContainer.visibility = if (show) View.GONE else View.VISIBLE
    }

    override fun onDestroy() {
        super.onDestroy()
        userPostsListener?.remove()
        currentUserListener?.remove()
        profileUserListener?.remove()
    }
}
