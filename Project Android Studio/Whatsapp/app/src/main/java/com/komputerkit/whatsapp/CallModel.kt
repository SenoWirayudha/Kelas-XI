package com.komputerkit.whatsapp

/**
 * Model untuk history panggilan
 */
data class CallModel(
    var callId: String = "",           // ID panggilan
    var userId: String = "",           // ID user
    var username: String = "",         // Nama user
    var profileImage: String = "",     // URL foto profil
    var callType: String = "voice",    // voice atau video
    var callStatus: String = "missed", // incoming, outgoing, missed
    var timestamp: Long = 0L,          // Waktu panggilan
    var duration: Long = 0L            // Durasi panggilan (detik)
)
