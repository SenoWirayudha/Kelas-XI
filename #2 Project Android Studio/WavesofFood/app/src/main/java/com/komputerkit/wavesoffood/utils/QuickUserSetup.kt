package com.komputerkit.wavesoffood.utils

import android.content.Context
import android.widget.Toast
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.model.User

class QuickUserSetup {
    
    companion object {
        private val dummyUsers = listOf(
            Triple("admin@food.com", "123456", "Admin User"),
            Triple("user1@food.com", "123456", "John Doe"),
            Triple("user2@food.com", "123456", "Jane Smith"),
            Triple("user3@food.com", "123456", "Mike Johnson"),
            Triple("test@food.com", "123456", "Test User")
        )
        
        fun createQuickUsers(context: Context) {
            val auth = FirebaseAuth.getInstance()
            val db = FirebaseFirestore.getInstance()
            var count = 0
            
            Toast.makeText(context, "Creating ${dummyUsers.size} test users...", Toast.LENGTH_SHORT).show()
            
            dummyUsers.forEach { (email, password, name) ->
                auth.createUserWithEmailAndPassword(email, password)
                    .addOnSuccessListener { result ->
                        val userId = result.user?.uid ?: return@addOnSuccessListener
                        
                        val user = User(
                            id = userId,
                            name = name,
                            email = email,
                            phone = "+62812345${(1000..9999).random()}",
                            address = null,
                            profileImage = ""
                        )
                        
                        db.collection("users").document(userId).set(user)
                            .addOnSuccessListener {
                                count++
                                if (count == dummyUsers.size) {
                                    Toast.makeText(context, "✅ All $count users created successfully!", Toast.LENGTH_LONG).show()
                                }
                            }
                            .addOnFailureListener { 
                                Toast.makeText(context, "Failed to save user: $name", Toast.LENGTH_SHORT).show()
                            }
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(context, "Failed to create: $name - ${e.message}", Toast.LENGTH_SHORT).show()
                    }
            }
        }
        
        fun showUserCredentials(context: Context) {
            val credentials = dummyUsers.joinToString("\n") { (email, password, name) ->
                "$name\nEmail: $email\nPassword: $password\n"
            }
            
            Toast.makeText(context, "Test Users:\n$credentials", Toast.LENGTH_LONG).show()
        }
    }
}
