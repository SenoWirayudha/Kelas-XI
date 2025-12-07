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
import com.komputerkit.whatsapp.databinding.ActivityRegisterBinding

/**
 * Activity untuk registrasi user baru
 * Input: Username, Email, Password
 */
class RegisterActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityRegisterBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var database: FirebaseDatabase
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Inisialisasi Firebase
        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance()
        
        // Setup listeners
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        // Tombol Register
        binding.btnRegister.setOnClickListener {
            validateAndRegister()
        }
        
        // Link ke Login
        binding.tvGoToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }
    
    /**
     * Validasi input dan proses registrasi
     */
    private fun validateAndRegister() {
        val username = binding.etUsername.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        val confirmPassword = binding.etConfirmPassword.text.toString()
        
        // Reset error
        binding.tilUsername.error = null
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        binding.tilConfirmPassword.error = null
        
        // Validasi Username
        if (username.isEmpty()) {
            binding.tilUsername.error = "Username tidak boleh kosong"
            binding.etUsername.requestFocus()
            return
        }
        
        if (username.length < 3) {
            binding.tilUsername.error = "Username minimal 3 karakter"
            binding.etUsername.requestFocus()
            return
        }
        
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
        
        // Validasi Confirm Password
        if (confirmPassword.isEmpty()) {
            binding.tilConfirmPassword.error = "Konfirmasi password tidak boleh kosong"
            binding.etConfirmPassword.requestFocus()
            return
        }
        
        if (password != confirmPassword) {
            binding.tilConfirmPassword.error = "Password tidak sama"
            binding.etConfirmPassword.requestFocus()
            return
        }
        
        // Semua validasi lolos, proses registrasi
        registerUser(username, email, password)
    }
    
    /**
     * Proses registrasi user ke Firebase Authentication
     */
    private fun registerUser(username: String, email: String, password: String) {
        // Tampilkan loading
        showLoading(true)
        
        Log.d("RegisterActivity", "Starting registration for email: $email")
        
        // Buat akun dengan Firebase Authentication
        auth.createUserWithEmailAndPassword(email, password)
            .addOnSuccessListener { authResult ->
                // Registrasi berhasil
                val user = authResult.user
                Log.d("RegisterActivity", "Auth success, UID: ${user?.uid}")
                
                if (user != null) {
                    saveUserToDatabase(user.uid, username, email)
                } else {
                    showLoading(false)
                    Toast.makeText(this, "Gagal mendapatkan user ID", Toast.LENGTH_SHORT).show()
                    Log.e("RegisterActivity", "User is null after registration")
                }
            }
            .addOnFailureListener { exception ->
                // Registrasi gagal
                showLoading(false)
                
                val errorMessage = when {
                    exception.message?.contains("network", ignoreCase = true) == true -> 
                        "Tidak ada koneksi internet"
                    exception.message?.contains("email address is already in use", ignoreCase = true) == true -> 
                        "Email sudah terdaftar"
                    exception.message?.contains("weak password", ignoreCase = true) == true -> 
                        "Password terlalu lemah"
                    exception.message?.contains("badly formatted", ignoreCase = true) == true -> 
                        "Format email tidak valid"
                    else -> "Registrasi gagal: ${exception.message}"
                }
                
                Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
                Log.e("RegisterActivity", "Registration failed", exception)
            }
    }
    
    /**
     * Simpan data user ke Firebase Realtime Database
     */
    private fun saveUserToDatabase(uid: String, username: String, email: String) {
        Log.d("RegisterActivity", "Saving user to database: $uid")
        
        val user = UserModel(
            uid = uid,
            username = username,
            email = email,
            profileImage = "",
            status = "online",
            lastSeen = System.currentTimeMillis()
        )
        
        // Simpan ke node "Users/{uid}"
        database.getReference("Users")
            .child(uid)
            .setValue(user)
            .addOnSuccessListener {
                showLoading(false)
                Toast.makeText(this, "Registrasi berhasil!", Toast.LENGTH_SHORT).show()
                Log.d("RegisterActivity", "User saved successfully: $uid")
                
                // Pindah ke HomeActivity
                val intent = Intent(this, HomeActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            .addOnFailureListener { exception ->
                showLoading(false)
                
                val errorMessage = when {
                    exception.message?.contains("Permission denied", ignoreCase = true) == true -> 
                        "Akses ditolak. Cek Firebase Database Rules"
                    exception.message?.contains("network", ignoreCase = true) == true -> 
                        "Tidak ada koneksi internet"
                    else -> "Gagal menyimpan data: ${exception.message}"
                }
                
                Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
                Log.e("RegisterActivity", "Failed to save user to database", exception)
                
                // Hapus akun dari Auth jika gagal simpan ke database
                auth.currentUser?.delete()?.addOnCompleteListener {
                    Log.d("RegisterActivity", "Auth user deleted after database save failure")
                }
            }
    }
    
    /**
     * Tampilkan/sembunyikan loading indicator
     */
    private fun showLoading(isLoading: Boolean) {
        if (isLoading) {
            binding.progressBar.visibility = View.VISIBLE
            binding.btnRegister.isEnabled = false
            binding.btnRegister.text = ""
        } else {
            binding.progressBar.visibility = View.GONE
            binding.btnRegister.isEnabled = true
            binding.btnRegister.text = "Daftar"
        }
    }
}
