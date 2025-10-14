package com.komputerkit.socialmediaapp

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class DebugActivity : AppCompatActivity() {
    
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("DebugActivity", "Starting debug session")
        
        // Check current user
        val currentUser = auth.currentUser
        Log.d("DebugActivity", "Current user: ${currentUser?.uid}")
        Log.d("DebugActivity", "User email: ${currentUser?.email}")
        
        // Check Firestore data
        checkFirestoreData()
    }
    
    private fun checkFirestoreData() {
        // Check posts collection
        firestore.collection("posts")
            .get()
            .addOnSuccessListener { documents ->
                Log.d("DebugActivity", "Posts found: ${documents.size()}")
                for (document in documents) {
                    Log.d("DebugActivity", "Post ID: ${document.id}")
                    Log.d("DebugActivity", "Post data: ${document.data}")
                }
            }
            .addOnFailureListener { exception ->
                Log.e("DebugActivity", "Error getting posts", exception)
            }
            
        // Check users collection
        firestore.collection("users")
            .get()
            .addOnSuccessListener { documents ->
                Log.d("DebugActivity", "Users found: ${documents.size()}")
                for (document in documents) {
                    Log.d("DebugActivity", "User ID: ${document.id}")
                    Log.d("DebugActivity", "User data: ${document.data}")
                }
            }
            .addOnFailureListener { exception ->
                Log.e("DebugActivity", "Error getting users", exception)
            }
    }
}
