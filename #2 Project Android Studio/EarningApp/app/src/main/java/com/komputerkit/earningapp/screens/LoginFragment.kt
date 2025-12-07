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
import com.komputerkit.earningapp.data.repository.UserRepository
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {
    
    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var loginButton: Button
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_login, container, false)
        
        // Initialize views
        emailEditText = view.findViewById(R.id.emailEditText)
        passwordEditText = view.findViewById(R.id.passwordEditText)
        loginButton = view.findViewById(R.id.loginButton)
        
        // Set click listener
        loginButton.setOnClickListener {
            handleLogin()
        }
        
        return view
    }
    
    private fun handleLogin() {
        val email = emailEditText.text.toString().trim()
        val password = passwordEditText.text.toString().trim()
        
        // Basic validation
        if (email.isEmpty()) {
            emailEditText.error = "Email is required"
            return
        }
        
        if (password.isEmpty()) {
            passwordEditText.error = "Password is required"
            return
        }
        
        // Login with Room Database
        lifecycleScope.launch {
            try {
                val database = AppDatabase.getDatabase(requireContext())
                val userRepository = UserRepository(database.userDao())
                
                // Attempt login
                val user = userRepository.login(email, password)
                
                if (user != null) {
                    // Save session
                    val sharedPref = requireActivity().getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
                    sharedPref.edit().apply {
                        putBoolean("isLoggedIn", true)
                        putInt("userId", user.id)
                        putString("userName", user.username)
                        putString("userEmail", user.email)
                        apply()
                    }
                    
                    // Navigate to Home
                    requireActivity().runOnUiThread {
                        Toast.makeText(requireContext(), "Welcome back, ${user.username}!", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(requireActivity(), HomeActivity::class.java))
                        requireActivity().finish()
                    }
                } else {
                    // Login failed
                    requireActivity().runOnUiThread {
                        Toast.makeText(requireContext(), "Invalid email or password", Toast.LENGTH_SHORT).show()
                        passwordEditText.error = "Invalid credentials"
                    }
                }
                
            } catch (e: Exception) {
                requireActivity().runOnUiThread {
                    Toast.makeText(requireContext(), "Login failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
