package com.komputerkit.blogapp.ui

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.blogapp.MainActivity
import com.komputerkit.blogapp.databinding.ActivitySplashBinding

class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Hide action bar
        supportActionBar?.hide()

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()

        // Check authentication status after 2 seconds (shorter delay)
        Handler(Looper.getMainLooper()).postDelayed({
            checkAuthAndNavigate()
        }, 2000)
    }

    private fun checkAuthAndNavigate() {
        val currentUser = auth.currentUser
        val intent = Intent(this, MainActivity::class.java)
        
        if (currentUser != null && !currentUser.isAnonymous) {
            // User is already logged in with a real account, go directly to home
            intent.putExtra("SKIP_TO_HOME", true)
        } else {
            // User is not logged in or is anonymous, will start with welcome screen
            intent.putExtra("SKIP_TO_HOME", false)
        }
        
        startActivity(intent)
        finish()
    }
}
