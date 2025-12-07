package com.komputerkit.whatsapp

/**
 * Model untuk status
 */
data class StatusModel(
    var userId: String = "",           // ID user
    var username: String = "",         // Nama user
    var profileImage: String = "",     // URL foto profil
    var statusImageUrl: String = "",   // URL status (gambar/video)
    var statusText: String = "",       // Text status
    var timestamp: Long = 0L           // Waktu upload status
)
