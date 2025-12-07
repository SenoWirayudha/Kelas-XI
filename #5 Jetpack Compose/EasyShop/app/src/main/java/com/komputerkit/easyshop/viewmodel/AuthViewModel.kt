package com.komputerkit.easyshop.viewmodel

import androidx.lifecycle.ViewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.easyshop.model.UserModel

/**
 * ViewModel untuk menangani otentikasi menggunakan Firebase Authentication
 * dan menyimpan data pengguna di Firestore
 */
class AuthViewModel : ViewModel() {
    
    // Inisialisasi Firebase Auth dan Firestore
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
    
    /**
     * Properti untuk mengecek apakah user sudah login
     * Berguna untuk splash screen atau navigasi awal
     */
    val isUserLoggedIn: Boolean
        get() = auth.currentUser != null
    
    /**
     * Fungsi untuk mendaftarkan user baru dengan email dan password
     * Setelah berhasil, data user akan disimpan ke Firestore
     *
     * @param email Email pengguna
     * @param password Password pengguna
     * @param name Nama lengkap pengguna
     * @param onResult Callback dengan status keberhasilan (Boolean) dan pesan error (String?)
     */
    fun signUp(
        email: String,
        password: String,
        name: String,
        onResult: (Boolean, String?) -> Unit
    ) {
        // Validasi input
        if (email.isBlank() || password.isBlank() || name.isBlank()) {
            onResult(false, "Semua field harus diisi")
            return
        }
        
        if (password.length < 6) {
            onResult(false, "Password minimal 6 karakter")
            return
        }
        
        // Buat user baru dengan Firebase Auth
        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    // Dapatkan UID dari user yang baru dibuat
                    val userId = auth.currentUser?.uid
                    
                    if (userId != null) {
                        // Buat objek UserModel
                        val user = UserModel(
                            uid = userId,
                            name = name,
                            email = email
                        )
                        
                        // Simpan data user ke Firestore dengan UID sebagai document ID
                        firestore.collection("users")
                            .document(userId)
                            .set(user.toMap())
                            .addOnSuccessListener {
                                onResult(true, null)
                            }
                            .addOnFailureListener { exception ->
                                // Jika gagal simpan ke Firestore, hapus user dari Auth
                                auth.currentUser?.delete()
                                onResult(false, "Gagal menyimpan data: ${exception.message}")
                            }
                    } else {
                        onResult(false, "Gagal mendapatkan user ID")
                    }
                } else {
                    // Gagal membuat user
                    val errorMessage = when {
                        task.exception?.message?.contains("email address is already") == true ->
                            "Email sudah terdaftar"
                        task.exception?.message?.contains("network") == true ->
                            "Periksa koneksi internet Anda"
                        task.exception?.message?.contains("badly formatted") == true ->
                            "Format email tidak valid"
                        else -> task.exception?.message ?: "Pendaftaran gagal"
                    }
                    onResult(false, errorMessage)
                }
            }
    }
    
    /**
     * Fungsi untuk login dengan email dan password
     *
     * @param email Email pengguna
     * @param password Password pengguna
     * @param onResult Callback dengan status keberhasilan (Boolean) dan pesan error (String?)
     */
    fun signIn(
        email: String,
        password: String,
        onResult: (Boolean, String?) -> Unit
    ) {
        // Validasi input
        if (email.isBlank() || password.isBlank()) {
            onResult(false, "Email dan password harus diisi")
            return
        }
        
        // Sign in dengan Firebase Auth
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    onResult(true, null)
                } else {
                    // Gagal login
                    val errorMessage = when {
                        task.exception?.message?.contains("no user record") == true ||
                        task.exception?.message?.contains("invalid-credential") == true ->
                            "Email atau password salah"
                        task.exception?.message?.contains("network") == true ->
                            "Periksa koneksi internet Anda"
                        task.exception?.message?.contains("badly formatted") == true ->
                            "Format email tidak valid"
                        else -> task.exception?.message ?: "Login gagal"
                    }
                    onResult(false, errorMessage)
                }
            }
    }
    
    /**
     * Fungsi untuk logout/sign out
     */
    fun signOut() {
        auth.signOut()
    }
    
    /**
     * Fungsi untuk mendapatkan data user dari Firestore
     *
     * @param onResult Callback dengan UserModel jika berhasil, atau null jika gagal
     */
    fun getCurrentUserData(onResult: (UserModel?) -> Unit) {
        val userId = auth.currentUser?.uid
        
        if (userId != null) {
            firestore.collection("users")
                .document(userId)
                .get()
                .addOnSuccessListener { document ->
                    if (document.exists()) {
                        val userData = document.data
                        if (userData != null) {
                            onResult(UserModel.fromMap(userData))
                        } else {
                            onResult(null)
                        }
                    } else {
                        onResult(null)
                    }
                }
                .addOnFailureListener {
                    onResult(null)
                }
        } else {
            onResult(null)
        }
    }
}
