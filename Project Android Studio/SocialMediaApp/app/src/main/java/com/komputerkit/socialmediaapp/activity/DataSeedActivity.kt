package com.komputerkit.socialmediaapp.activity

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.komputerkit.socialmediaapp.data.FirestoreDataSeeder
import com.komputerkit.socialmediaapp.databinding.ActivityDataSeedBinding

class DataSeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDataSeedBinding
    private lateinit var dataSeeder: FirestoreDataSeeder

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDataSeedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        dataSeeder = FirestoreDataSeeder()
        setupUI()
    }

    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }

        binding.seedDataButton.setOnClickListener {
            seedData()
        }

        binding.clearDataButton.setOnClickListener {
            clearData()
        }
        
        binding.updateStoriesButton.setOnClickListener {
            updateStories()
        }
        
        // Ensure current user exists when activity starts
        dataSeeder.ensureCurrentUserExists()
    }

    private fun seedData() {
        showLoading(true)
        binding.statusText.text = "Seeding sample data to Firestore..."
        
        try {
            dataSeeder.seedData()
            
            // Simulate delay for better UX
            binding.statusText.postDelayed({
                showLoading(false)
                binding.statusText.text = "✅ Sample data seeded successfully!\n\n" +
                        "Created:\n" +
                        "• 5 Users with profiles\n" +
                        "• 6 Posts with likes/comments\n" +
                        "• 5 Stories\n" +
                        "• 5 Notifications\n\n" +
                        "You can now test the app with realistic data!"
                Toast.makeText(this@DataSeedActivity, "Sample data seeded successfully!", Toast.LENGTH_SHORT).show()
            }, 2000)
            
        } catch (e: Exception) {
            showLoading(false)
            binding.statusText.text = "❌ Error seeding data: ${e.message}"
            Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun clearData() {
        showLoading(true)
        binding.statusText.text = "Clearing all data from Firestore..."
        
        try {
            dataSeeder.clearData()
            
            // Simulate delay for better UX
            binding.statusText.postDelayed({
                showLoading(false)
                binding.statusText.text = "🗑️ All data cleared successfully!\n\n" +
                        "Removed all documents from:\n" +
                        "• Users collection\n" +
                        "• Posts collection\n" +
                        "• Stories collection\n" +
                        "• Notifications collection"
                Toast.makeText(this@DataSeedActivity, "All data cleared successfully!", Toast.LENGTH_SHORT).show()
            }, 2000)
            
        } catch (e: Exception) {
            showLoading(false)
            binding.statusText.text = "❌ Error clearing data: ${e.message}"
            Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun updateStories() {
        showLoading(true)
        binding.statusText.text = "Updating existing stories..."
        
        try {
            dataSeeder.updateExistingStories()
            
            // Simulate delay for better UX
            binding.statusText.postDelayed({
                showLoading(false)
                binding.statusText.text = "✅ Stories updated successfully!\n\n" +
                        "Updated all stories with:\n" +
                        "• Correct user names\n" +
                        "• Proper profile images\n" +
                        "• Fixed data inconsistencies"
                Toast.makeText(this@DataSeedActivity, "Stories updated successfully!", Toast.LENGTH_SHORT).show()
            }, 2000)
            
        } catch (e: Exception) {
            showLoading(false)
            binding.statusText.text = "❌ Error updating stories: ${e.message}"
            Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.seedDataButton.isEnabled = !show
        binding.clearDataButton.isEnabled = !show
        binding.updateStoriesButton.isEnabled = !show
    }
}
