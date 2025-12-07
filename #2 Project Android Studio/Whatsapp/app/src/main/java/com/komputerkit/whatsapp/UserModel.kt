package com.komputerkit.whatsapp

/**
 * Model data untuk user/pengguna
 */
data class UserModel(
    var uid: String = "",           // ID unik user dari Firebase Auth
    var username: String = "",      // Username/nama pengguna
    var email: String = "",         // Email address
    var profileImage: String = "",  // URL foto profil (opsional)
    var status: String = "offline", // Status online/offline
    var lastSeen: Long = 0L        // Waktu terakhir online
) {
    // Constructor tanpa password (password tidak disimpan di database)
    // Password hanya untuk authentication, disimpan di Firebase Auth
}
