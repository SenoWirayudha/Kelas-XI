package com.komputerkit.firebaseauthdemo.ui.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.auth.FirebaseAuth

/**
 * ViewModel untuk menangani semua operasi otentikasi Firebase
 * Menggunakan FirebaseAuth untuk email dan password authentication
 */
class AuthViewModel : ViewModel() {
    
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    
    private val _authState = MutableLiveData<AuthState>()
    val authState: LiveData<AuthState> = _authState
    
    init {
        checkAuthStatus()
    }
    
    /**
     * Memeriksa status otentikasi saat ini
     * Dipanggil secara otomatis saat ViewModel dibuat
     */
    private fun checkAuthStatus() {
        if (auth.currentUser != null) {
            _authState.value = AuthState.Authenticated
        } else {
            _authState.value = AuthState.Unauthenticated
        }
    }
    
    /**
     * Fungsi untuk mendaftarkan user baru dengan email dan password
     * @param email Email user
     * @param password Password user
     */
    fun signup(email: String, password: String) {
        // Validasi input kosong
        if (email.isBlank()) {
            _authState.value = AuthState.Error("Silakan masukkan email untuk mendaftar")
            return
        }
        
        if (password.isBlank()) {
            _authState.value = AuthState.Error("Silakan masukkan password untuk mendaftar")
            return
        }
        
        // Validasi format email
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _authState.value = AuthState.Error("Format email tidak valid")
            return
        }
        
        // Validasi panjang password
        if (password.length < 6) {
            _authState.value = AuthState.Error("Password minimal 6 karakter")
            return
        }
        
        // Set status loading sebelum API call
        _authState.value = AuthState.Loading
        
        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    // Registrasi berhasil
                    _authState.value = AuthState.Authenticated
                } else {
                    // Registrasi gagal
                    val errorMessage = task.exception?.message ?: "Registrasi gagal"
                    _authState.value = AuthState.Error(errorMessage)
                }
            }
    }
    
    /**
     * Fungsi untuk login user dengan email dan password
     * @param email Email user
     * @param password Password user
     */
    fun login(email: String, password: String) {
        // Validasi input kosong
        if (email.isBlank()) {
            _authState.value = AuthState.Error("Silakan masukkan email untuk login")
            return
        }
        
        if (password.isBlank()) {
            _authState.value = AuthState.Error("Silakan masukkan password untuk login")
            return
        }
        
        // Validasi format email
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _authState.value = AuthState.Error("Format email tidak valid")
            return
        }
        
        // Set status loading sebelum API call
        _authState.value = AuthState.Loading
        
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    // Login berhasil
                    _authState.value = AuthState.Authenticated
                } else {
                    // Login gagal
                    val errorMessage = task.exception?.message ?: "Login gagal"
                    _authState.value = AuthState.Error(errorMessage)
                }
            }
    }
    
    /**
     * Fungsi untuk logout user
     * Mengatur state menjadi Unauthenticated setelah logout
     */
    fun signout() {
        auth.signOut()
        _authState.value = AuthState.Unauthenticated
    }
}