package com.komputerkit.moview

import android.content.Context
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.NavigationUI
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
        handleMovieDetailIntent(intent)
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleMovieDetailIntent(intent)
    }

    private fun handleMovieDetailIntent(intent: android.content.Intent) {
        val movieId = intent.getIntExtra("navigate_to_movie_id", 0)
        if (movieId > 0) {
            intent.removeExtra("navigate_to_movie_id")
            try {
                navController.navigate(
                    R.id.movieDetailFragment,
                    Bundle().apply { putInt("movieId", movieId) }
                )
            } catch (e: Exception) {
                Toast.makeText(this, "Gagal membuka detail film", Toast.LENGTH_SHORT).show()
            }
            return
        }

        val logFilmMovieId = intent.getIntExtra("navigate_to_log_film_movie_id", 0)
        if (logFilmMovieId > 0) {
            intent.removeExtra("navigate_to_log_film_movie_id")
            try {
                navController.navigate(
                    R.id.logFilmFragment,
                    Bundle().apply {
                        putInt("movieId", logFilmMovieId)
                        putBoolean("isEditMode", false)
                        putInt("reviewId", 0)
                        putString("existingReviewText", null)
                        putInt("existingRating", 0)
                        putString("watchedDate", null)
                    }
                )
            } catch (e: Exception) {
                Toast.makeText(this, "Gagal membuka halaman review/log", Toast.LENGTH_SHORT).show()
            }
            return
        }

        val posterBackdropMovieId = intent.getIntExtra("navigate_to_poster_backdrop_movie_id", 0)
        if (posterBackdropMovieId > 0) {
            intent.removeExtra("navigate_to_poster_backdrop_movie_id")
            try {
                navController.navigate(
                    R.id.posterBackdropFragment,
                    Bundle().apply {
                        putInt("movieId", posterBackdropMovieId)
                        putBoolean("openBackdropsTab", false)
                    }
                )
            } catch (e: Exception) {
                Toast.makeText(this, "Gagal membuka ganti poster/backdrop", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        NavigationUI.setupWithNavController(binding.bottomNavigation, navController)
        
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

            when (destination.id) {
                R.id.navigation_home -> binding.bottomNavigation.menu.findItem(R.id.navigation_home)?.isChecked = true
                R.id.navigation_profile -> binding.bottomNavigation.menu.findItem(R.id.navigation_profile)?.isChecked = true
                R.id.navigation_search -> binding.bottomNavigation.menu.findItem(R.id.navigation_search)?.isChecked = true
                R.id.navigation_notification -> binding.bottomNavigation.menu.findItem(R.id.navigation_notification)?.isChecked = true
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
                repository.getNotificationsAsync(userId)
            } catch (_: Exception) { }
        }
    }
    
    fun updateNotificationBadge(count: Int) {
        val menuItem = binding.bottomNavigation.menu.findItem(R.id.navigation_notification)
        if (menuItem == null) return

        if (count > 0) {
            val badge = binding.bottomNavigation.getOrCreateBadge(R.id.navigation_notification)
            badge.number = count
            badge.isVisible = true
        } else {
            binding.bottomNavigation.removeBadge(R.id.navigation_notification)
        }
    }
}
