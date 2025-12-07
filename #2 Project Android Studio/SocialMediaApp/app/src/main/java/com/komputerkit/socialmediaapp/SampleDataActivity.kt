package com.komputerkit.socialmediaapp

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

class SampleDataActivity : AppCompatActivity() {
    
    private lateinit var firebaseRepository: FirebaseRepository
    private lateinit var button: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        firebaseRepository = FirebaseRepository()
        
        // Simple layout with a button to add sample data
        button = Button(this).apply {
            text = "Add Sample Data & Continue"
            setOnClickListener {
                addSampleDataAndContinue()
            }
        }
        
        setContentView(button)
    }
    
    private fun addSampleDataAndContinue() {
        firebaseRepository.addSampleData()
        
        Toast.makeText(this, "Sample data added! Opening main app...", Toast.LENGTH_LONG).show()
        
        // Wait a bit for data to be added, then go to main activity
        button.postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, 2000)
    }
}
