package com.komputerkit.earningapp.screens

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.komputerkit.earningapp.R
import com.komputerkit.earningapp.data.database.AppDatabase
import com.komputerkit.earningapp.data.entity.User
import com.komputerkit.earningapp.data.repository.UserRepository
import kotlinx.coroutines.launch

class SignupFragment : Fragment() {
    
    private lateinit var usernameEditText: EditText
    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var signupButton: Button
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_signup, container, false)
        
        // Initialize views
        usernameEditText = view.findViewById(R.id.usernameEditText)
        emailEditText = view.findViewById(R.id.emailEditText)
        passwordEditText = view.findViewById(R.id.passwordEditText)
        signupButton = view.findViewById(R.id.signupButton)
        
        // Set click listener
        signupButton.setOnClickListener {
            handleSignup()
        }
        
        return view
    }
    
    private fun handleSignup() {
        val username = usernameEditText.text.toString().trim()
        val email = emailEditText.text.toString().trim()
        val password = passwordEditText.text.toString().trim()
        
        // Basic validation
        if (username.isEmpty()) {
            usernameEditText.error = "Username is required"
            return
        }
        
        if (email.isEmpty()) {
            emailEditText.error = "Email is required"
            return
        }
        
        if (password.isEmpty()) {
            passwordEditText.error = "Password is required"
            return
        }
        
        if (password.length < 6) {
            passwordEditText.error = "Password must be at least 6 characters"
            return
        }
        
        // Save to Room Database
        lifecycleScope.launch {
            try {
                val database = AppDatabase.getDatabase(requireContext())
                val userRepository = UserRepository(database.userDao())
                
                // Check if email already exists
                val existingUser = userRepository.getUserByEmail(email)
                if (existingUser != null) {
                    requireActivity().runOnUiThread {
                        emailEditText.error = "Email already registered"
                        Toast.makeText(requireContext(), "Email already exists", Toast.LENGTH_SHORT).show()
                    }
                    return@launch
                }
                
                // Create new user
                val newUser = User(
                    username = username,
                    email = email,
                    password = password,
                    coins = 100 // Starting bonus
                )
                
                val userId = userRepository.insertUser(newUser)
                
                // Save session
                val sharedPref = requireActivity().getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
                sharedPref.edit().apply {
                    putBoolean("isLoggedIn", true)
                    putInt("userId", userId.toInt())
                    putString("userName", username)
                    putString("userEmail", email)
                    apply()
                }
                
                // Navigate to Home
                requireActivity().runOnUiThread {
                    Toast.makeText(requireContext(), "Sign up successful! Welcome $username!", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(requireActivity(), HomeActivity::class.java))
                    requireActivity().finish()
                }
                
            } catch (e: Exception) {
                requireActivity().runOnUiThread {
                    Toast.makeText(requireContext(), "Sign up failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
