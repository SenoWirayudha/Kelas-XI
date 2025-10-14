package com.komputerkit.socialmediaapp.activity

import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.socialmediaapp.MainActivity
import com.komputerkit.socialmediaapp.databinding.ActivityRegisterBinding
import com.komputerkit.socialmediaapp.model.User

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        firestore = FirebaseFirestore.getInstance()

        setupUI()
    }

    private fun setupUI() {
        binding.registerButton.setOnClickListener {
            registerUser()
        }

        binding.loginTextView.setOnClickListener {
            navigateToLogin()
        }
    }

    private fun registerUser() {
        val fullName = binding.fullNameEditText.text.toString().trim()
        val username = binding.usernameEditText.text.toString().trim()
        val email = binding.emailEditText.text.toString().trim()
        val password = binding.passwordEditText.text.toString().trim()
        val confirmPassword = binding.confirmPasswordEditText.text.toString().trim()

        // Validate input
        if (!validateInput(fullName, username, email, password, confirmPassword)) {
            return
        }

        // Check terms and conditions
        if (!binding.termsCheckBox.isChecked) {
            showToast("Please accept the Terms and Conditions")
            return
        }

        showLoading(true)

        // Check if username is available
        checkUsernameAvailability(username) { isAvailable ->
            if (isAvailable) {
                createFirebaseAccount(fullName, username, email, password)
            } else {
                showLoading(false)
                binding.usernameInputLayout.error = "Username is already taken"
            }
        }
    }

    private fun validateInput(
        fullName: String, 
        username: String, 
        email: String, 
        password: String, 
        confirmPassword: String
    ): Boolean {
        var isValid = true

        // Validate full name
        if (TextUtils.isEmpty(fullName)) {
            binding.fullNameInputLayout.error = "Full name is required"
            isValid = false
        } else if (fullName.length < 2) {
            binding.fullNameInputLayout.error = "Full name must be at least 2 characters"
            isValid = false
        } else {
            binding.fullNameInputLayout.error = null
        }

        // Validate username
        if (TextUtils.isEmpty(username)) {
            binding.usernameInputLayout.error = "Username is required"
            isValid = false
        } else if (username.length < 3) {
            binding.usernameInputLayout.error = "Username must be at least 3 characters"
            isValid = false
        } else if (!username.matches(Regex("^[a-zA-Z0-9._]+$"))) {
            binding.usernameInputLayout.error = "Username can only contain letters, numbers, dots, and underscores"
            isValid = false
        } else {
            binding.usernameInputLayout.error = null
        }

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

        // Validate confirm password
        if (TextUtils.isEmpty(confirmPassword)) {
            binding.confirmPasswordInputLayout.error = "Please confirm your password"
            isValid = false
        } else if (password != confirmPassword) {
            binding.confirmPasswordInputLayout.error = "Passwords do not match"
            isValid = false
        } else {
            binding.confirmPasswordInputLayout.error = null
        }

        return isValid
    }

    private fun checkUsernameAvailability(username: String, callback: (Boolean) -> Unit) {
        firestore.collection("users")
            .whereEqualTo("username", username)
            .get()
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val isAvailable = task.result?.isEmpty() == true
                    callback(isAvailable)
                } else {
                    showToast("Error checking username availability")
                    callback(false)
                }
            }
    }

    private fun createFirebaseAccount(fullName: String, username: String, email: String, password: String) {
        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    // Account creation success
                    val firebaseUser = auth.currentUser
                    if (firebaseUser != null) {
                        createUserProfile(firebaseUser.uid, fullName, username, email)
                    }
                } else {
                    showLoading(false)
                    val errorMessage = task.exception?.message ?: "Registration failed"
                    showToast(errorMessage)
                }
            }
    }

    private fun createUserProfile(userId: String, fullName: String, username: String, email: String) {
        val user = User(
            id = userId,
            username = username,
            fullName = fullName,
            email = email,
            profileImageUrl = "",
            bio = "Hey there! I'm using Social Media App",
            isVerified = false,
            followersCount = 0,
            followingCount = 0,
            postsCount = 0,
            createdAt = System.currentTimeMillis()
        )

        firestore.collection("users")
            .document(userId)
            .set(user)
            .addOnCompleteListener { task ->
                showLoading(false)
                if (task.isSuccessful) {
                    showToast("Account created successfully!")
                    navigateToMain()
                } else {
                    showToast("Failed to create user profile")
                    // Optionally delete the Firebase Auth user if profile creation fails
                    auth.currentUser?.delete()
                }
            }
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
        startActivity(intent)
        finish()
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        finish()
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.registerButton.isEnabled = !show
        binding.loginTextView.isEnabled = !show
    }

    private fun showToast(message: String) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
    }
}
