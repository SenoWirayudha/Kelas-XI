package com.komputerkit.whatsapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import com.komputerkit.whatsapp.databinding.ActivityLoginBinding

/**
 * Activity untuk login user
 * Input: Email, Password
 */
class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var database: FirebaseDatabase
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Inisialisasi Firebase
        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance()
        
        // Cek apakah user sudah login
        checkCurrentUser()
        
        // Setup listeners
        setupClickListeners()
    }
    
    /**
     * Cek apakah user sudah login sebelumnya
     */
    private fun checkCurrentUser() {
        val currentUser = auth.currentUser
        if (currentUser != null) {
            // User sudah login, langsung ke HomeActivity
            startActivity(Intent(this, HomeActivity::class.java))
            finish()
        }
    }
    
    private fun setupClickListeners() {
        // Tombol Login
        binding.btnLogin.setOnClickListener {
            validateAndLogin()
        }
        
        // Link ke Register
        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
        
        // Forgot Password
        binding.tvForgotPassword.setOnClickListener {
            handleForgotPassword()
        }
    }
    
    /**
     * Validasi input dan proses login
     */
    private fun validateAndLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        
        // Reset error
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        
        // Validasi Email
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email tidak boleh kosong"
            binding.etEmail.requestFocus()
            return
        }
        
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Format email tidak valid"
            binding.etEmail.requestFocus()
            return
        }
        
        // Validasi Password
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password tidak boleh kosong"
            binding.etPassword.requestFocus()
            return
        }
        
        if (password.length < 6) {
            binding.tilPassword.error = "Password minimal 6 karakter"
            binding.etPassword.requestFocus()
            return
        }
        
        // Semua validasi lolos, proses login
        loginUser(email, password)
    }
    
    /**
     * Proses login dengan Firebase Authentication
     */
    private fun loginUser(email: String, password: String) {
        // Tampilkan loading
        showLoading(true)
        
        Log.d("LoginActivity", "Attempting login for email: $email")
        
        // Login dengan Firebase Auth
        auth.signInWithEmailAndPassword(email, password)
            .addOnSuccessListener { authResult ->
                // Login berhasil
                val user = authResult.user
                Log.d("LoginActivity", "Login success, UID: ${user?.uid}")
                
                if (user != null) {
                    // Update status online
                    updateUserStatus(user.uid, true)
                } else {
                    showLoading(false)
                    Toast.makeText(this, "Login berhasil", Toast.LENGTH_SHORT).show()
                    navigateToMain()
                }
            }
            .addOnFailureListener { exception ->
                // Login gagal
                showLoading(false)
                
                val errorMessage = when {
                    exception.message?.contains("network", ignoreCase = true) == true -> 
                        "Tidak ada koneksi internet"
                    exception.message?.contains("badly formatted", ignoreCase = true) == true -> 
                        "Format email salah"
                    exception.message?.contains("no user record", ignoreCase = true) == true -> 
                        "Email tidak terdaftar"
                    exception.message?.contains("password is invalid", ignoreCase = true) == true || 
                    exception.message?.contains("wrong password", ignoreCase = true) == true -> 
                        "Password salah"
                    else -> "Login gagal: ${exception.message}"
                }
                
                Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
                Log.e("LoginActivity", "Login failed", exception)
            }
    }
    
    /**
     * Update status user menjadi online
     */
    private fun updateUserStatus(uid: String, isOnline: Boolean) {
        Log.d("LoginActivity", "Updating user status for: $uid")
        
        val updates = hashMapOf<String, Any>(
            "status" to if (isOnline) "online" else "offline",
            "lastSeen" to System.currentTimeMillis()
        )
        
        database.getReference("Users")
            .child(uid)
            .updateChildren(updates)
            .addOnSuccessListener {
                showLoading(false)
                Toast.makeText(this, "Login berhasil!", Toast.LENGTH_SHORT).show()
                Log.d("LoginActivity", "User status updated successfully: $uid")
                navigateToMain()
            }
            .addOnFailureListener { exception ->
                showLoading(false)
                
                Log.e("LoginActivity", "Failed to update status, but continuing to MainActivity", exception)
                
                // Tetap lanjut ke MainActivity meskipun update status gagal
                Toast.makeText(this, "Login berhasil!", Toast.LENGTH_SHORT).show()
                navigateToMain()
            }
    }
    
    /**
     * Pindah ke HomeActivity
     */
    private fun navigateToMain() {
        Log.d("LoginActivity", "Navigating to HomeActivity")
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    /**
     * Handle forgot password (reset password via email)
     */
    private fun handleForgotPassword() {
        val email = binding.etEmail.text.toString().trim()
        
        if (email.isEmpty()) {
            Toast.makeText(this, "Masukkan email terlebih dahulu", Toast.LENGTH_SHORT).show()
            binding.etEmail.requestFocus()
            return
        }
        
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Format email tidak valid", Toast.LENGTH_SHORT).show()
            binding.etEmail.requestFocus()
            return
        }
        
        // Kirim email reset password
        auth.sendPasswordResetEmail(email)
            .addOnSuccessListener {
                Toast.makeText(
                    this,
                    "Link reset password telah dikirim ke email Anda",
                    Toast.LENGTH_LONG
                ).show()
            }
            .addOnFailureListener { exception ->
                Toast.makeText(
                    this,
                    "Gagal mengirim email: ${exception.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
    }
    
    /**
     * Tampilkan/sembunyikan loading indicator
     */
    private fun showLoading(isLoading: Boolean) {
        if (isLoading) {
            binding.progressBar.visibility = View.VISIBLE
            binding.btnLogin.isEnabled = false
            binding.btnLogin.text = ""
        } else {
            binding.progressBar.visibility = View.GONE
            binding.btnLogin.isEnabled = true
            binding.btnLogin.text = "Login"
        }
    }
}
