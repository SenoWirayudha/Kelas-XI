package com.komputerkit.wavesoffoodadmin.activity

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.wavesoffoodadmin.FirebaseHelper
import com.komputerkit.wavesoffoodadmin.MainActivity
import com.komputerkit.wavesoffoodadmin.R
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var auth: FirebaseAuth
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        auth = FirebaseHelper.getAuth()
        
        // Check if user is already logged in
        if (FirebaseHelper.isUserLoggedIn()) {
            checkAdminAndProceed()
            return
        }
        
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            
            if (validateInput(email, password)) {
                loginAdmin(email, password)
            }
        }
    }
    
    private fun validateInput(email: String, password: String): Boolean {
        if (email.isEmpty()) {
            binding.etEmail.error = "Email tidak boleh kosong"
            return false
        }
        
        if (password.isEmpty()) {
            binding.etPassword.error = "Password tidak boleh kosong"
            return false
        }
        
        if (password.length < 6) {
            binding.etPassword.error = "Password minimal 6 karakter"
            return false
        }
        
        return true
    }
    
    private fun loginAdmin(email: String, password: String) {
        showLoading(true)
        
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                showLoading(false)
                
                if (task.isSuccessful) {
                    Utils.showToast(this, "Login berhasil!")
                    checkAdminAndProceed()
                } else {
                    val errorMessage = when {
                        task.exception?.message?.contains("password") == true -> 
                            "Password salah. Silakan coba lagi."
                        task.exception?.message?.contains("user") == true -> 
                            "Email tidak terdaftar sebagai admin."
                        else -> "Login gagal: ${task.exception?.message}"
                    }
                    Utils.showLongToast(this, errorMessage)
                }
            }
    }
    
    private fun checkAdminAndProceed() {
        showLoading(true)
        
        FirebaseHelper.isCurrentUserAdmin { isAdmin ->
            showLoading(false)
            
            if (isAdmin) {
                // Redirect to main admin dashboard
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            } else {
                // Not an admin, sign out and show error
                auth.signOut()
                Utils.showLongToast(this, "Akses ditolak. Anda bukan admin yang terdaftar.")
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !show
        binding.etEmail.isEnabled = !show
        binding.etPassword.isEnabled = !show
    }
}
