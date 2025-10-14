package com.komputerkit.socialmediaapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.activity.AddStoryActivity
import com.komputerkit.socialmediaapp.activity.CreatePostActivity
import com.komputerkit.socialmediaapp.activity.DataSeedActivity
import com.komputerkit.socialmediaapp.activity.EditProfileActivity
import com.komputerkit.socialmediaapp.activity.LoginActivity
import com.komputerkit.socialmediaapp.activity.ProfileActivity
import com.komputerkit.socialmediaapp.activity.SearchActivity
import com.komputerkit.socialmediaapp.adapter.PostAdapter
import com.komputerkit.socialmediaapp.adapter.UserStoriesAdapter
import com.komputerkit.socialmediaapp.adapter.InstagramStoryAdapter
import com.komputerkit.socialmediaapp.fragment.CommentsBottomSheetFragment
import com.komputerkit.socialmediaapp.base.BaseActivity
import com.komputerkit.socialmediaapp.databinding.ActivityMainBinding
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.model.UserStories
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.viewmodel.UserViewModel
import com.komputerkit.socialmediaapp.viewmodel.MainViewModel

class MainActivity : BaseActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var userViewModel: UserViewModel
    private lateinit var mainViewModel: MainViewModel
    
    private lateinit var userStoriesAdapter: UserStoriesAdapter
    private lateinit var instagramStoryAdapter: InstagramStoryAdapter
    private lateinit var postAdapter: PostAdapter
    
    private var storiesListener: ListenerRegistration? = null
    private var postsListener: ListenerRegistration? = null
    private var notificationsListener: ListenerRegistration? = null

    // Activity Result Launcher for StoryViewerActivity
    private val storyViewerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        // Refresh stories if a story was deleted
        if (result.resultCode == RESULT_OK) {
            val storyDeleted = result.data?.getBooleanExtra("story_deleted", false) ?: false
            if (storyDeleted) {
                // The real-time listener will automatically refresh the stories
                // No additional action needed as Firestore listener handles updates
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("MainActivity", "onCreate started")
        
        // Check authentication first
        if (auth.currentUser == null) {
            Log.d("MainActivity", "No user logged in, redirecting to login")
            navigateToLogin()
            return
        }
        
        Log.d("MainActivity", "User logged in: ${auth.currentUser?.uid}")
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initializeFirebase()
        setupUI()
        setupRecyclerViews()
        
        Log.d("MainActivity", "Setting up bottom navigation...")
        setupBottomNavigation(R.id.nav_home)
        Log.d("MainActivity", "Bottom navigation setup complete")
        
        loadData()
        
        Log.d("MainActivity", "onCreate completed")
    }

    private fun initializeFirebase() {
        firebaseRepository = FirebaseRepository()
        userViewModel = ViewModelProvider(this)[UserViewModel::class.java]
        mainViewModel = ViewModelProvider(this)[MainViewModel::class.java]
        
        // Add sample data on first run (remove in production)
        // firebaseRepository.addSampleData()
    }

    private fun setupUI() {
        try {
            setSupportActionBar(binding.toolbar)
            supportActionBar?.title = "Social Media"
        } catch (e: IllegalStateException) {
            Log.e("MainActivity", "Error setting up toolbar: ${e.message}")
            // Continue without toolbar if there's an issue
        }
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_test -> {
                val intent = Intent(this, TestActivity::class.java)
                startActivity(intent)
                true
            }
            R.id.action_seed_data -> {
                val intent = Intent(this, DataSeedActivity::class.java)
                startActivity(intent)
                true
            }
            R.id.action_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun setupRecyclerViews() {
        Log.d("MainActivity", "Setting up RecyclerViews...")
        
        // Get current user ID from Firebase Auth
        val currentUserId = auth.currentUser?.uid ?: ""
        Log.d("MainActivity", "Current user ID for stories: $currentUserId")
        
        // Setup Stories RecyclerView with Instagram-style adapter
        instagramStoryAdapter = InstagramStoryAdapter(
            userStoriesList = emptyList(),
            currentUserId = currentUserId,
            onLongPressOwnStory = { userStory ->
                // This callback is no longer used as delete is handled inside adapter
                // Keep for backward compatibility
            },
            firebaseRepository = firebaseRepository,
            getUserForId = { userId ->
                userViewModel.getUserById(userId)
            },
            lifecycleOwner = this
        )
        
        // Set click listeners
        instagramStoryAdapter.setOnUserStoryClickListener { userStory ->
            onUserStoriesClick(userStory)
        }
        
        instagramStoryAdapter.setOnAddStoryClickListener {
            startAddStoryActivity()
        }
        
        // Set story deleted listener to refresh the RecyclerView
        instagramStoryAdapter.setOnStoryDeletedListener {
            // The real-time listener will automatically update the adapter
            // but we can add additional logic here if needed
            Log.d("MainActivity", "Story deleted - RecyclerView will refresh automatically")
        }
        
        binding.storiesRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = instagramStoryAdapter
            setHasFixedSize(true)
        }
        Log.d("MainActivity", "Stories RecyclerView setup complete")

        // Setup Posts RecyclerView
        postAdapter = PostAdapter(
            posts = emptyList(),
            onLikeClick = { post -> onLikeClick(post) },
            onCommentClick = { post -> onCommentClick(post) },
            onShareClick = { post -> onShareClick(post) },
            onSaveClick = { post -> onSaveClick(post) },
            onProfileClick = { userId -> onProfileClick(userId) },
            onDeleteClick = { post -> onDeleteClick(post) },
            getUserForPost = { userId -> userViewModel.getUserById(userId) },
            lifecycleOwner = this,
            currentUserId = auth.currentUser?.uid ?: ""
        )
        
        binding.postsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = postAdapter
            setHasFixedSize(true)
        }
        Log.d("MainActivity", "Posts RecyclerView setup complete")
        Log.d("MainActivity", "RecyclerView height: ${binding.postsRecyclerView.layoutParams.height}")
        Log.d("MainActivity", "RecyclerView visibility: ${binding.postsRecyclerView.visibility}")
    }

    private fun loadData() {
        Log.d("MainActivity", "loadData() called")
        setupDataObservers()
        setupNotificationListener()
    }
    
    private fun setupDataObservers() {
        // Observe stories dengan auto refresh user data
        mainViewModel.userStories.observe(this) { userStoriesList ->
            Log.d("MainActivity", "Stories updated with ${userStoriesList.size} users")
            instagramStoryAdapter.updateUserStories(userStoriesList)
        }
        
        // Observe posts dengan auto refresh user data  
        mainViewModel.posts.observe(this) { posts ->
            Log.d("MainActivity", "Posts updated with ${posts.size} posts")
            // Update posts di adapter akan dilakukan via listener yang sudah ada
            updatePostsWithUserData(posts)
        }
        
        // Observe loading states
        mainViewModel.isLoadingStories.observe(this) { isLoading ->
            // Show loading indicator jika diperlukan
        }
        
        mainViewModel.isLoadingPosts.observe(this) { isLoading ->
            // Show loading indicator jika diperlukan  
        }
    }
    
    private fun updatePostsWithUserData(posts: List<Post>) {
        // Update post adapter dengan data terbaru
        // PostAdapter akan get user data via mainViewModel.getUserForPost()
        postAdapter.updatePosts(posts)
    }

    // Story interactions
    private fun onUserStoriesClick(userStories: UserStories) {
        // Mark user stories as viewed (we'll update this after story viewer closes)
        instagramStoryAdapter.markUserStoriesAsViewed(userStories.userId)
        
        // Open full-screen story viewer with first story
        val firstStory = userStories.firstStory
        if (firstStory != null) {
            val intent = Intent(this, com.komputerkit.socialmediaapp.activity.StoryViewerActivity::class.java)
            intent.putExtra(com.komputerkit.socialmediaapp.activity.StoryViewerActivity.EXTRA_STORY_ID, firstStory.id)
            intent.putExtra(com.komputerkit.socialmediaapp.activity.StoryViewerActivity.EXTRA_USER_ID, currentUserId)
            storyViewerLauncher.launch(intent)
        }
    }

    // Post interactions
    private fun onLikeClick(post: Post) {
        firebaseRepository.toggleLike(post.id, currentUserId) { success, isLiked ->
            runOnUiThread {
                if (success) {
                    val message = if (isLiked) "Liked!" else "Unliked!"
                    showToast(message)
                } else {
                    showToast("Failed to update like")
                }
            }
        }
    }

    private fun onCommentClick(post: Post) {
        val commentsBottomSheet = CommentsBottomSheetFragment.newInstance(post.id)
        commentsBottomSheet.setOnProfileClickListener { userId ->
            if (userId != currentUserId) {
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("userId", userId)
                startActivity(intent)
            }
        }
        commentsBottomSheet.show(supportFragmentManager, "CommentsBottomSheet")
    }

    private fun onProfileClick(userId: String) {
        if (userId != currentUserId) {
            val intent = Intent(this, ProfileActivity::class.java)
            intent.putExtra("userId", userId)
            startActivity(intent)
        }
    }

    private fun onShareClick(post: Post) {
        // TODO: Implement sharing functionality
        showToast("Sharing ${post.userName}'s post")
    }

    private fun onSaveClick(post: Post) {
        // TODO: Implement save functionality
        showToast("Saved ${post.userName}'s post")
    }

    private fun onDeleteClick(post: Post) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Delete Post")
            .setMessage("Are you sure you want to delete this post? This action cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                firebaseRepository.deletePost(post.id) { success ->
                    runOnUiThread {
                        if (success) {
                            showToast("Post deleted successfully")
                        } else {
                            showToast("Failed to delete post")
                        }
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun startAddStoryActivity() {
        Log.d("MainActivity", "Starting AddStoryActivity")
        val intent = Intent(this, AddStoryActivity::class.java)
        startActivity(intent)
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        finish()
    }

    private fun deleteStory(story: Story) {
        Log.d("MainActivity", "Deleting story: ${story.id}")
        firebaseRepository.deleteStory(story.id) { success ->
            runOnUiThread {
                if (success) {
                    showToast("Story deleted successfully")
                } else {
                    showToast("Failed to delete story")
                }
            }
        }
    }

    private fun setupNotificationListener() {
        if (currentUserId.isNotEmpty()) {
            notificationsListener = firebaseRepository.getUserNotifications(currentUserId) { notifications ->
                runOnUiThread {
                    val unreadCount = notifications.count { !it.isRead }
                    updateNotificationBadge(unreadCount)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        storiesListener?.remove()
        postsListener?.remove()
        notificationsListener?.remove()
    }
}