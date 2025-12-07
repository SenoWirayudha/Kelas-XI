package com.komputerkit.socialmediaapp.activity

import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.socialmediaapp.MainActivity
import com.komputerkit.socialmediaapp.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        firestore = FirebaseFirestore.getInstance()

        // Check if user is already logged in
        if (auth.currentUser != null) {
            navigateToMain()
            return
        }

        setupUI()
    }

    private fun setupUI() {
        binding.loginButton.setOnClickListener {
            loginUser()
        }

        binding.registerTextView.setOnClickListener {
            navigateToRegister()
        }

        binding.forgotPasswordTextView.setOnClickListener {
            resetPassword()
        }
    }

    private fun loginUser() {
        val email = binding.emailEditText.text.toString().trim()
        val password = binding.passwordEditText.text.toString().trim()

        // Validate input
        if (!validateInput(email, password)) {
            return
        }

        showLoading(true)

        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                showLoading(false)
                if (task.isSuccessful) {
                    // Login success
                    showToast("Login successful!")
                    navigateToMain()
                } else {
                    // Login failed
                    val errorMessage = task.exception?.message ?: "Login failed"
                    showToast(errorMessage)
                    
                    // Clear password field on error
                    binding.passwordEditText.text?.clear()
                }
            }
    }

    private fun validateInput(email: String, password: String): Boolean {
        var isValid = true

        // Validate email
        if (TextUtils.isEmpty(email)) {
            binding.emailInputLayout.error = "Email is required"
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.emailInputLayout.error = "Invalid email format"
            isValid = false
        } else {
            binding.emailInputLayout.error = null
        }

        // Validate password
        if (TextUtils.isEmpty(password)) {
            binding.passwordInputLayout.error = "Password is required"
            isValid = false
        } else if (password.length < 6) {
            binding.passwordInputLayout.error = "Password must be at least 6 characters"
            isValid = false
        } else {
            binding.passwordInputLayout.error = null
        }

        return isValid
    }

    private fun resetPassword() {
        val email = binding.emailEditText.text.toString().trim()
        
        if (TextUtils.isEmpty(email)) {
            binding.emailInputLayout.error = "Enter email to reset password"
            return
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.emailInputLayout.error = "Invalid email format"
            return
        }

        showLoading(true)

        auth.sendPasswordResetEmail(email)
            .addOnCompleteListener { task ->
                showLoading(false)
                if (task.isSuccessful) {
                    showToast("Password reset email sent to $email")
                } else {
                    val errorMessage = task.exception?.message ?: "Failed to send reset email"
                    showToast(errorMessage)
                }
            }
    }

    private fun navigateToRegister() {
        val intent = Intent(this, RegisterActivity::class.java)
        startActivity(intent)
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        finish()
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.loginButton.isEnabled = !show
        binding.registerTextView.isEnabled = !show
        binding.forgotPasswordTextView.isEnabled = !show
    }

    private fun showToast(message: String) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
    }
}
