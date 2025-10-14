package com.komputerkit.blogapp

import android.os.Bundle
import android.view.View
import androidx.activity.OnBackPressedCallback
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.komputerkit.blogapp.databinding.ActivityMainBinding
import com.komputerkit.blogapp.viewmodel.AuthViewModel

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupNavigation()
        observeAuthState()
        handleInitialNavigation()
        setupBackButtonHandling()
    }

    private fun setupBackButtonHandling() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val navHostFragment = supportFragmentManager
                    .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
                val navController = navHostFragment.navController
                
                // If we're on the home or profile fragment, exit the app
                if (navController.currentDestination?.id == R.id.homeFragment || 
                    navController.currentDestination?.id == R.id.profileFragment) {
                    finish()
                } else {
                    // Otherwise, use normal back navigation
                    if (!navController.popBackStack()) {
                        finish()
                    }
                }
            }
        })
    }

    private fun handleInitialNavigation() {
        val skipToHome = intent.getBooleanExtra("SKIP_TO_HOME", false)
        if (skipToHome) {
            // User is already logged in, navigate directly to home
            try {
                val navHostFragment = supportFragmentManager
                    .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
                val navController = navHostFragment.navController
                
                // Create a navigation graph that starts with home instead of welcome
                val navGraph = navController.navInflater.inflate(R.navigation.nav_graph)
                navGraph.setStartDestination(R.id.homeFragment)
                navController.graph = navGraph
                
                // Make sure bottom navigation is visible
                binding.bottomNavigation.visibility = View.VISIBLE
            } catch (e: Exception) {
                // If navigation fails, fall back to default behavior
                // The user will see the welcome screen and can login normally
            }
        }
    }

    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController

        // Setup bottom navigation with nav controller
        binding.bottomNavigation.setupWithNavController(navController)

        // Hide bottom navigation on certain fragments
        navController.addOnDestinationChangedListener { _, destination, _ ->
            when (destination.id) {
                R.id.homeFragment, R.id.profileFragment -> {
                    binding.bottomNavigation.visibility = View.VISIBLE
                }
                else -> {
                    binding.bottomNavigation.visibility = View.GONE
                }
            }
        }
    }

    private fun observeAuthState() {
        authViewModel.authState.observe(this) { user ->
            // Just observe for other purposes if needed
            // Let individual fragments handle their own navigation
        }
    }
}