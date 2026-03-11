package com.komputerkit.moview

import android.content.Context
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.databinding.ActivityMainBinding
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupNavigation()
        checkLoginStatus()
        loadUnreadNotificationCount()
    }
    
    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController
        
        // Setup Bottom Navigation with Navigation Component
        binding.bottomNavigation.setupWithNavController(navController)
        
        // Hide bottom navigation on login screen
        navController.addOnDestinationChangedListener { _, destination, _ ->
            when (destination.id) {
                R.id.loginFragment, R.id.signUpFragment -> {
                    binding.bottomNavigation.visibility = View.GONE
                }
                else -> {
                    binding.bottomNavigation.visibility = View.VISIBLE
                }
            }
        }
    }
    
    private fun checkLoginStatus() {
        val sharedPrefs = getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val isLoggedIn = sharedPrefs.getBoolean("isLoggedIn", false)
        
        if (!isLoggedIn) {
            // User not logged in, navigate to login
            navController.navigate(R.id.loginFragment)
        }
        // If logged in, stay at default destination (home)
    }
    
    private fun loadUnreadNotificationCount() {
        val sharedPrefs = getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val userId = sharedPrefs.getInt("userId", 0)
        if (userId == 0) return
        
        lifecycleScope.launch {
            try {
                val repository = MovieRepository()
                val notifications = repository.getNotificationsAsync(userId)
                val unreadCount = notifications.count { !it.isRead }
                updateNotificationBadge(unreadCount)
            } catch (_: Exception) { }
        }
    }
    
    fun updateNotificationBadge(count: Int) {
        if (count > 0) {
            val badge = binding.bottomNavigation.getOrCreateBadge(R.id.navigation_notification)
            badge.number = count
            badge.isVisible = true
        } else {
            binding.bottomNavigation.removeBadge(R.id.navigation_notification)
        }
    }
}
