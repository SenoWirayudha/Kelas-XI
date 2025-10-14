package com.komputerkit.firebaseauthdemo.ui.auth

/**
 * Sealed class yang merepresentasikan semua state otentikasi yang mungkin
 */
sealed class AuthState {
    /**
     * User berhasil login/terotentikasi
     */
    object Authenticated : AuthState()
    
    /**
     * User belum login atau sudah logout
     */
    object Unauthenticated : AuthState()
    
    /**
     * Sedang melakukan proses otentikasi (loading)
     */
    object Loading : AuthState()
    
    /**
     * Terjadi error selama proses otentikasi
     * @param message Pesan error yang akan ditampilkan
     */
    data class Error(val message: String) : AuthState()
}