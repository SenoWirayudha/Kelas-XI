package com.komputerkit.whatsapp

/**
 * Model data untuk pesan chat
 */
data class MessageModel(
    var uid: String = "",           // ID pengirim pesan
    var message: String = "",       // Isi pesan
    var timestamp: Long = 0L        // Waktu pengiriman pesan
)
