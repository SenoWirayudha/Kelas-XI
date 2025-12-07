package com.komputerkit.socialmediaapp.activity

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.adapter.NotificationAdapter
import com.komputerkit.socialmediaapp.base.BaseActivity
import com.komputerkit.socialmediaapp.databinding.ActivityNotificationBinding
import com.komputerkit.socialmediaapp.model.Notification
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

class NotificationActivity : BaseActivity() {

    private lateinit var binding: ActivityNotificationBinding
    private lateinit var notificationAdapter: NotificationAdapter
    
    private var notificationsListener: ListenerRegistration? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupRecyclerView()
        setupBottomNavigation(R.id.nav_notifications)
        loadNotifications()
    }

    private fun setupUI() {        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupRecyclerView() {
        notificationAdapter = NotificationAdapter(
            notifications = emptyList(),
            onNotificationClick = { notification -> onNotificationClick(notification) }
        )
        
        binding.notificationsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@NotificationActivity)
            adapter = notificationAdapter
        }
    }

    private fun loadNotifications() {
        showLoading(true)
        
        notificationsListener?.remove()
        notificationsListener = firebaseRepository.getUserNotifications(currentUserId) { notifications ->
            runOnUiThread {
                showLoading(false)
                
                if (notifications.isEmpty()) {
                    binding.emptyStateText.visibility = View.VISIBLE
                    binding.notificationsRecyclerView.visibility = View.GONE
                } else {
                    binding.emptyStateText.visibility = View.GONE
                    binding.notificationsRecyclerView.visibility = View.VISIBLE
                    
                    notificationAdapter.updateNotifications(notifications)
                    
                    // Mark notifications as read after user has seen them (with delay)
                    binding.notificationsRecyclerView.postDelayed({
                        markAllNotificationsAsRead()
                    }, 2000) // 2 second delay
                }
                
                Log.d("NotificationActivity", "Loaded ${notifications.size} notifications")
            }
        }
        
        // Mark all notifications as read when opened
        firebaseRepository.markAllNotificationsAsRead(currentUserId) { success ->
            if (success) {
                Log.d("NotificationActivity", "All notifications marked as read")
            }
        }
    }

    private fun onNotificationClick(notification: Notification) {
        // Mark individual notification as read if not already
        if (!notification.isRead) {
            firebaseRepository.markNotificationAsRead(notification.id) { success ->
                Log.d("NotificationActivity", "Notification marked as read: $success")
            }
        }
        
        // Navigate based on notification type
        when (notification.type) {
            "like" -> {
                // Navigate to post detail if postId exists
                notification.postId?.let { postId ->
                    val intent = Intent(this, PostDetailActivity::class.java)
                    intent.putExtra("postId", postId)
                    intent.putExtra("userId", notification.fromUserId)
                    startActivity(intent)
                }
            }
            "follow" -> {
                // Navigate to follower's profile
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("userId", notification.fromUserId)
                startActivity(intent)
            }
            else -> {
                // Handle other notification types
                Log.d("NotificationActivity", "Unhandled notification type: ${notification.type}")
            }
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.contentContainer.visibility = if (show) View.GONE else View.VISIBLE
    }

    private fun markAllNotificationsAsRead() {
        firebaseRepository.markAllNotificationsAsRead(currentUserId) {
            // Update badge to 0 after marking as read
            runOnUiThread {
                updateNotificationBadge(0)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        notificationsListener?.remove()
    }
}
