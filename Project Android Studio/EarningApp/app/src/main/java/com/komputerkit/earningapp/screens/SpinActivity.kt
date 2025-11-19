package com.komputerkit.earningapp.screens

import android.animation.ObjectAnimator
import android.content.Context
import android.os.Bundle
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.komputerkit.earningapp.R
import com.komputerkit.earningapp.data.database.AppDatabase
import com.komputerkit.earningapp.data.entity.Transaction
import com.komputerkit.earningapp.data.repository.TransactionRepository
import com.komputerkit.earningapp.data.repository.UserRepository
import kotlinx.coroutines.launch
import kotlin.random.Random

class SpinActivity : AppCompatActivity() {
    
    private lateinit var wheelImageView: ImageView
    private lateinit var numbersLayout: View
    private lateinit var spinButton: Button
    private lateinit var coinsTextView: TextView
    private var isSpinning = false
    
    private var userId: Int = 0
    private lateinit var userRepository: UserRepository
    private lateinit var transactionRepository: TransactionRepository
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_spin)
        
        // Setup action bar
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Spin Wheel"
        
        // Get userId
        val sharedPref = getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
        userId = sharedPref.getInt("userId", 0)
        
        // Initialize database
        val database = AppDatabase.getDatabase(this)
        userRepository = UserRepository(database.userDao())
        transactionRepository = TransactionRepository(database.transactionDao())
        
        // Initialize views
        wheelImageView = findViewById(R.id.wheelImageView)
        numbersLayout = findViewById(R.id.numbersLayout)
        spinButton = findViewById(R.id.spinButton)
        coinsTextView = findViewById(R.id.coinsTextView)
        
        // Load current coins
        loadCoins()
        
        // Setup spin button
        spinButton.setOnClickListener {
            if (!isSpinning) {
                spinWheel()
            }
        }
    }
    
    private fun loadCoins() {
        if (userId == 0) return
        
        lifecycleScope.launch {
            try {
                val user = userRepository.getUserById(userId)
                user?.let {
                    runOnUiThread {
                        coinsTextView.text = it.coins.toString()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun spinWheel() {
        isSpinning = true
        spinButton.isEnabled = false
        
        // Random rotation between 1800 and 2520 degrees (5-7 full rotations)
        val randomDegrees = Random.nextInt(1800, 2521).toFloat()
        
        // Get current rotation and add new rotation
        val fromRotation = wheelImageView.rotation
        val toRotation = fromRotation + randomDegrees
        
        // Create rotation animation for wheel
        val wheelAnimator = ObjectAnimator.ofFloat(
            wheelImageView,
            View.ROTATION,
            fromRotation,
            toRotation
        )
        
        // Create rotation animation for numbers (same as wheel)
        val numbersAnimator = ObjectAnimator.ofFloat(
            numbersLayout,
            View.ROTATION,
            fromRotation,
            toRotation
        )
        
        wheelAnimator.duration = 4000 // 4 seconds for better visual effect
        wheelAnimator.interpolator = DecelerateInterpolator(1.5f)
        
        numbersAnimator.duration = 4000
        numbersAnimator.interpolator = DecelerateInterpolator(1.5f)
        
        wheelAnimator.addUpdateListener { animation ->
            if (animation.animatedFraction == 1f) {
                // Animation completed
                // Calculate reward based on final position
                val reward = calculateRewardFromPosition(toRotation)
                giveReward(reward)
                
                // Keep final rotation (don't reset to 0)
                isSpinning = false
                spinButton.isEnabled = true
            }
        }
        
        // Start both animations together
        wheelAnimator.start()
        numbersAnimator.start()
    }
    
    private fun calculateRewardFromPosition(finalRotation: Float): Int {
        // Normalize rotation to 0-360 degrees
        val normalizedRotation = finalRotation % 360
        
        // Adjust for pointer at top (0 degrees)
        // Wheel is divided into 8 segments of 45 degrees each
        // Segments start from top (0°) and go clockwise
        
        // Define the reward for each segment (clockwise from top)
        // Pointer is at top, so we need to determine which segment is under it
        val segmentRewards = mapOf(
            0 to 100,   // Top: 0-45° (Red)
            1 to 50,    // Top-Right: 45-90° (Blue)
            2 to 20,    // Right: 90-135° (Green)
            3 to 80,    // Bottom-Right: 135-180° (Purple)
            4 to 30,    // Bottom: 180-225° (Orange)
            5 to 60,    // Bottom-Left: 225-270° (Cyan)
            6 to 40,    // Left: 270-315° (Pink)
            7 to 70     // Top-Left: 315-360° (Yellow)
        )
        
        // Calculate which segment (0-7)
        val segmentIndex = ((normalizedRotation + 22.5f) / 45f).toInt() % 8
        
        return segmentRewards[segmentIndex] ?: 50
    }
    
    private fun calculateReward(): Int {
        // This is now deprecated, use calculateRewardFromPosition instead
        return Random.nextInt(10, 101)
    }
    
    private fun giveReward(coins: Int) {
        if (userId == 0) return
        
        lifecycleScope.launch {
            try {
                // Get current user
                val user = userRepository.getUserById(userId)
                user?.let {
                    val newCoins = it.coins + coins
                    
                    // Update coins in database
                    userRepository.updateCoins(userId, newCoins)
                    
                    // Log transaction
                    transactionRepository.insertTransaction(
                        Transaction(
                            userId = userId,
                            type = "SPIN",
                            amount = coins,
                            description = "Spin Wheel Reward: $coins coins"
                        )
                    )
                    
                    // Update UI
                    runOnUiThread {
                        coinsTextView.text = newCoins.toString()
                        Toast.makeText(
                            this@SpinActivity,
                            "Selamat! Anda mendapat $coins koin! 🎉",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                runOnUiThread {
                    Toast.makeText(
                        this@SpinActivity,
                        "Error updating coins: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
