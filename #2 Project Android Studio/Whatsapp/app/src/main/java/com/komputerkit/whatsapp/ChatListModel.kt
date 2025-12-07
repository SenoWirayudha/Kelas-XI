package com.komputerkit.whatsapp

/**
 * Model untuk daftar chat/konversasi
 */
data class ChatListModel(
    var chatId: String = "",           // ID chat room
    var userId: String = "",           // ID user lawan bicara
    var username: String = "",         // Nama user
    var profileImage: String = "",     // URL foto profil
    var lastMessage: String = "",      // Pesan terakhir
    var lastMessageTime: Long = 0L,    // Waktu pesan terakhir
    var unreadCount: Int = 0           // Jumlah pesan belum dibaca
)
