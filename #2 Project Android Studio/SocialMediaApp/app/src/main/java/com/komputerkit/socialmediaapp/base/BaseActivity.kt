package com.komputerkit.socialmediaapp.base

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.socialmediaapp.MainActivity
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.activity.CreatePostActivity
import com.komputerkit.socialmediaapp.activity.LoginActivity
import com.komputerkit.socialmediaapp.activity.NotificationActivity
import com.komputerkit.socialmediaapp.util.MediaLoaderUtil
import com.komputerkit.socialmediaapp.activity.ProfileActivity
import com.komputerkit.socialmediaapp.activity.SearchActivity
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

abstract class BaseActivity : AppCompatActivity() {

    protected lateinit var bottomNavigation: BottomNavigationView
    protected var notificationBadge: TextView? = null
    protected lateinit var auth: FirebaseAuth
    protected lateinit var firebaseRepository: FirebaseRepository
    protected var currentUserId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        auth = FirebaseAuth.getInstance()
        firebaseRepository = FirebaseRepository()
        currentUserId = auth.currentUser?.uid ?: ""
        
        // Clean up old temporary video files periodically
        MediaLoaderUtil.cleanupTempVideoFiles(this)
    }

    protected fun setupBottomNavigation(currentMenuId: Int) {
        Log.d("BaseActivity", "Setting up bottom navigation with currentMenuId: $currentMenuId")
        
        // Find the BottomNavigationView and badge from the included layout
        bottomNavigation = findViewById(R.id.bottom_navigation)
        notificationBadge = findViewById(R.id.notification_badge)
        
        if (bottomNavigation != null) {
            Log.d("BaseActivity", "Bottom navigation found, setting selected item")
            bottomNavigation.selectedItemId = currentMenuId
            
            // Setup notification badge listener only if badge exists
            if (notificationBadge != null) {
                setupNotificationBadge()
            } else {
                Log.w("BaseActivity", "Notification badge not found in layout")
            }
            
            bottomNavigation.setOnItemSelectedListener { item ->
                Log.d("BaseActivity", "Bottom navigation item selected: ${item.itemId}")
                when (item.itemId) {
                    R.id.nav_home -> {
                        if (currentMenuId != R.id.nav_home) {
                            Log.d("BaseActivity", "Navigating to MainActivity")
                            navigateToActivity(MainActivity::class.java)
                        }
                        true
                    }
                    R.id.nav_search -> {
                        if (currentMenuId != R.id.nav_search) {
                            Log.d("BaseActivity", "Navigating to SearchActivity")
                            navigateToActivity(SearchActivity::class.java)
                        }
                        true
                    }
                    R.id.nav_add -> {
                        // Always allow create post (don't check current menu)
                        Log.d("BaseActivity", "Navigating to CreatePostActivity")
                        val intent = Intent(this, CreatePostActivity::class.java)
                        startActivity(intent)
                        true
                    }
                    R.id.nav_notifications -> {
                        if (currentMenuId != R.id.nav_notifications) {
                            Log.d("BaseActivity", "Navigating to NotificationActivity")
                            navigateToNotifications()
                        }
                        true
                    }
                    R.id.nav_profile -> {
                        Log.d("BaseActivity", "Navigating to ProfileActivity - currentUserId: $currentUserId")
                        try {
                            val intent = Intent(this, ProfileActivity::class.java)
                            intent.putExtra("userId", currentUserId)
                            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                            startActivity(intent)
                        } catch (e: Exception) {
                            Log.e("BaseActivity", "Error navigating to ProfileActivity", e)
                            showToast("Navigation error: ${e.message}")
                        }
                        true
                    }
                    else -> false
                }
            }
        } else {
            Log.e("BaseActivity", "Bottom navigation not found!")
        }
    }

    private fun navigateToActivity(activityClass: Class<*>) {
        try {
            Log.d("BaseActivity", "Attempting to navigate to ${activityClass.simpleName}")
            val intent = Intent(this, activityClass)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            // Don't call finish() to avoid closing the current activity abruptly
        } catch (e: Exception) {
            Log.e("BaseActivity", "Error navigating to ${activityClass.simpleName}", e)
            showToast("Navigation error: ${e.message}")
        }
    }

    private fun navigateToNotifications() {
        try {
            Log.d("BaseActivity", "Attempting to navigate to NotificationActivity")
            val intent = Intent(this, NotificationActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            // Don't call finish() to avoid closing the current activity abruptly
        } catch (e: Exception) {
            Log.e("BaseActivity", "Error navigating to NotificationActivity", e)
            showToast("Navigation error: ${e.message}")
        }
    }

    protected fun showToast(message: String) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
    }

    protected fun logout() {
        auth.signOut()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        finish()
    }

    private fun setupNotificationBadge() {
        if (currentUserId.isNotEmpty()) {
            firebaseRepository.getUnreadNotificationCount(currentUserId) { count ->
                runOnUiThread {
                    updateNotificationBadge(count)
                }
            }
        }
    }

    protected fun updateNotificationBadge(count: Int) {
        notificationBadge?.let { badge ->
            if (count > 0) {
                badge.visibility = View.VISIBLE
                badge.text = if (count > 99) "99+" else count.toString()
            } else {
                badge.visibility = View.GONE
            }
        }
    }

    private fun markAllNotificationsAsRead() {
        if (currentUserId.isNotEmpty()) {
            firebaseRepository.markAllNotificationsAsRead(currentUserId) {
                runOnUiThread {
                    updateNotificationBadge(0)
                }
            }
        }
    }
}
