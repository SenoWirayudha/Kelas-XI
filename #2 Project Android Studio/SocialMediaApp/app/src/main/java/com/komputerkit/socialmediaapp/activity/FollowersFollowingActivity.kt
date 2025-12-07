package com.komputerkit.socialmediaapp.activity

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.adapter.UserListAdapter
import com.komputerkit.socialmediaapp.databinding.ActivityFollowersFollowingBinding
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

class FollowersFollowingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityFollowersFollowingBinding
    private lateinit var firebaseRepository: FirebaseRepository
    private lateinit var userListAdapter: UserListAdapter
    private lateinit var auth: FirebaseAuth
    
    private var userId: String = ""
    private var listType: String = "" // "followers" or "following"
    private var currentUserId: String = ""

    companion object {
        const val EXTRA_USER_ID = "user_id"
        const val EXTRA_LIST_TYPE = "list_type"
        const val TYPE_FOLLOWERS = "followers"
        const val TYPE_FOLLOWING = "following"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFollowersFollowingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        auth = FirebaseAuth.getInstance()
        firebaseRepository = FirebaseRepository()
        currentUserId = auth.currentUser?.uid ?: ""

        // Get intent extras
        userId = intent.getStringExtra(EXTRA_USER_ID) ?: ""
        listType = intent.getStringExtra(EXTRA_LIST_TYPE) ?: TYPE_FOLLOWERS

        if (userId.isEmpty()) {
            finish()
            return
        }

        setupUI()
        setupRecyclerView()
        loadUsers()
    }

    private fun setupUI() {
        // Setup toolbar
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }

        // Set title based on list type
        binding.toolbar.title = if (listType == TYPE_FOLLOWERS) "Followers" else "Following"
    }

    private fun setupRecyclerView() {
        userListAdapter = UserListAdapter(
            users = emptyList(),
            currentUserId = currentUserId,
            onUserClick = { user -> 
                // Navigate to user profile (implement if needed)
            },
            onFollowClick = { user, isFollowing ->
                handleFollowClick(user, isFollowing)
            }
        )

        binding.usersRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@FollowersFollowingActivity)
            adapter = userListAdapter
        }
    }

    private fun loadUsers() {
        showLoading(true)

        when (listType) {
            TYPE_FOLLOWERS -> {
                firebaseRepository.getFollowers(userId) { followers ->
                    runOnUiThread {
                        showLoading(false)
                        if (followers.isEmpty()) {
                            showEmptyState()
                        } else {
                            userListAdapter.updateUsers(followers)
                        }
                    }
                }
            }
            TYPE_FOLLOWING -> {
                firebaseRepository.getFollowing(userId) { following ->
                    runOnUiThread {
                        showLoading(false)
                        if (following.isEmpty()) {
                            showEmptyState()
                        } else {
                            userListAdapter.updateUsers(following)
                        }
                    }
                }
            }
        }
    }

    private fun handleFollowClick(user: User, isCurrentlyFollowing: Boolean) {
        if (isCurrentlyFollowing) {
            // Unfollow
            firebaseRepository.unfollowUser(currentUserId, user.id) { success ->
                runOnUiThread {
                    if (success) {
                        // Update the adapter to reflect the change
                        userListAdapter.updateFollowStatus(user.id, false)
                    }
                }
            }
        } else {
            // Follow
            firebaseRepository.followUser(currentUserId, user.id) { success ->
                runOnUiThread {
                    if (success) {
                        // Update the adapter to reflect the change
                        userListAdapter.updateFollowStatus(user.id, true)
                    }
                }
            }
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.contentContainer.visibility = if (show) View.GONE else View.VISIBLE
    }

    private fun showEmptyState() {
        binding.emptyStateLayout.visibility = View.VISIBLE
        binding.usersRecyclerView.visibility = View.GONE

        val emptyMessage = if (listType == TYPE_FOLLOWERS) {
            "No followers yet"
        } else {
            "Not following anyone yet"
        }
        binding.emptyStateText.text = emptyMessage
    }
}