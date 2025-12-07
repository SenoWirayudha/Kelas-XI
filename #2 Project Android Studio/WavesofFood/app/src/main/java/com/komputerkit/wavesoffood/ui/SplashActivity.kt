package com.komputerkit.wavesoffood.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.wavesoffood.MainActivity
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.ActivitySplashBinding
import com.komputerkit.wavesoffood.ui.auth.AuthActivity

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySplashBinding
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Hide the action bar
        supportActionBar?.hide()
        
        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()

        // Add any animation to the logo here if needed
        // binding.ivLogo.startAnimation(...)

        // Navigate to appropriate activity after delay
        Handler(Looper.getMainLooper()).postDelayed({
            val currentUser = auth.currentUser
            if (currentUser != null) {
                // User is signed in, go to MainActivity
                startActivity(Intent(this, MainActivity::class.java))
            } else {
                // No user is signed in, go to AuthActivity
                startActivity(Intent(this, AuthActivity::class.java))
            }
            finish()
        }, SPLASH_DELAY)
    }

    companion object {
        private const val SPLASH_DELAY = 2000L // 2 seconds
    }
}
