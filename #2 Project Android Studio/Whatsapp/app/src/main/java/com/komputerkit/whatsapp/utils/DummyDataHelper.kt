package com.komputerkit.whatsapp.utils

import com.google.firebase.database.FirebaseDatabase
import com.komputerkit.whatsapp.MessageModel
import com.komputerkit.whatsapp.UserModel

/**
 * Helper class untuk insert dummy data ke Firebase Realtime Database
 * HANYA UNTUK TESTING/DEVELOPMENT!
 * 
 * Cara pakai:
 * DummyDataHelper.insertAllDummyData()
 */
object DummyDataHelper {
    
    private val database = FirebaseDatabase.getInstance()
    
    /**
     * Insert 5 dummy users ke database
     */
    fun insertDummyUsers() {
        val users = listOf(
            UserModel(
                uid = "dummy_user1",
                username = "John Doe",
                email = "john@example.com",
                profileImage = "",
                status = "online",
                lastSeen = System.currentTimeMillis()
            ),
            UserModel(
                uid = "dummy_user2",
                username = "Jane Smith",
                email = "jane@example.com",
                profileImage = "",
                status = "online",
                lastSeen = System.currentTimeMillis()
            ),
            UserModel(
                uid = "dummy_user3",
                username = "Bob Wilson",
                email = "bob@example.com",
                profileImage = "",
                status = "offline",
                lastSeen = System.currentTimeMillis() - 3600000 // 1 jam lalu
            ),
            UserModel(
                uid = "dummy_user4",
                username = "Alice Cooper",
                email = "alice@example.com",
                profileImage = "",
                status = "online",
                lastSeen = System.currentTimeMillis()
            ),
            UserModel(
                uid = "dummy_user5",
                username = "Charlie Brown",
                email = "charlie@example.com",
                profileImage = "",
                status = "offline",
                lastSeen = System.currentTimeMillis() - 86400000 // 1 hari lalu
            )
        )
        
        val usersRef = database.getReference("Users")
        users.forEach { user ->
            usersRef.child(user.uid).setValue(user)
                .addOnSuccessListener {
                    println("✅ User ${user.username} added successfully")
                }
                .addOnFailureListener { e ->
                    println("❌ Failed to add ${user.username}: ${e.message}")
                }
        }
    }
    
    /**
     * Insert dummy chat rooms dengan messages
     */
    fun insertDummyChats() {
        val chatRooms = mapOf(
            "room_dummy_user1_dummy_user2" to listOf(
                MessageModel(
                    uid = "dummy_user1",
                    message = "Hello Jane!",
                    timestamp = System.currentTimeMillis() - 3600000
                ),
                MessageModel(
                    uid = "dummy_user2",
                    message = "Hi John! How are you?",
                    timestamp = System.currentTimeMillis() - 3000000
                ),
                MessageModel(
                    uid = "dummy_user1",
                    message = "I'm good, thanks! How about you?",
                    timestamp = System.currentTimeMillis() - 2400000
                ),
                MessageModel(
                    uid = "dummy_user2",
                    message = "Great! Want to meet tomorrow?",
                    timestamp = System.currentTimeMillis() - 1800000
                )
            ),
            "room_dummy_user1_dummy_user3" to listOf(
                MessageModel(
                    uid = "dummy_user3",
                    message = "Hey John, are you coming to the meeting?",
                    timestamp = System.currentTimeMillis() - 7200000
                ),
                MessageModel(
                    uid = "dummy_user1",
                    message = "Yes, I'll be there at 10 AM",
                    timestamp = System.currentTimeMillis() - 7000000
                )
            ),
            "room_dummy_user2_dummy_user4" to listOf(
                MessageModel(
                    uid = "dummy_user4",
                    message = "Jane, did you finish the report?",
                    timestamp = System.currentTimeMillis() - 600000
                ),
                MessageModel(
                    uid = "dummy_user2",
                    message = "Almost done! Will send it by EOD",
                    timestamp = System.currentTimeMillis() - 300000
                )
            )
        )
        
        chatRooms.forEach { (roomId, messages) ->
            val roomRef = database.getReference("Chats").child(roomId).child("messages")
            messages.forEach { message ->
                val messageId = roomRef.push().key ?: return@forEach
                roomRef.child(messageId).setValue(message)
                    .addOnSuccessListener {
                        println("✅ Message added to $roomId")
                    }
                    .addOnFailureListener { e ->
                        println("❌ Failed to add message to $roomId: ${e.message}")
                    }
            }
        }
    }
    
    /**
     * Insert semua dummy data (users + chats)
     * Delay 2 detik antara users dan chats agar users sudah masuk dulu
     */
    fun insertAllDummyData() {
        println("🚀 Starting dummy data insertion...")
        insertDummyUsers()
        
        // Delay sedikit agar users sudah masuk sebelum chat
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            insertDummyChats()
            println("✅ Dummy data insertion completed!")
        }, 2000)
    }
    
    /**
     * Hapus semua dummy data
     * GUNAKAN DENGAN HATI-HATI!
     */
    fun deleteDummyData() {
        // Hapus dummy users
        val usersRef = database.getReference("Users")
        listOf("dummy_user1", "dummy_user2", "dummy_user3", "dummy_user4", "dummy_user5")
            .forEach { uid ->
                usersRef.child(uid).removeValue()
                    .addOnSuccessListener {
                        println("✅ Deleted user: $uid")
                    }
            }
        
        // Hapus dummy chats
        val chatsRef = database.getReference("Chats")
        listOf(
            "room_dummy_user1_dummy_user2",
            "room_dummy_user1_dummy_user3",
            "room_dummy_user2_dummy_user4"
        ).forEach { roomId ->
            chatsRef.child(roomId).removeValue()
                .addOnSuccessListener {
                    println("✅ Deleted chat room: $roomId")
                }
        }
        
        println("🗑️ Dummy data deletion completed!")
    }
}
