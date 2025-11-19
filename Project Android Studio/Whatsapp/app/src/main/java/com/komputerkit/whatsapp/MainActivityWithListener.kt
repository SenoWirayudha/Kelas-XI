package com.komputerkit.whatsapp

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.komputerkit.whatsapp.databinding.ActivityMainBinding

/**
 * CONTOH LENGKAP: MainActivity dengan fitur KIRIM dan TERIMA pesan real-time
 * 
 * File ini adalah contoh implementasi lengkap yang mencakup:
 * 1. Fungsi sendMessage() - Mengirim pesan
 * 2. setupMessageListener() - Menerima pesan real-time
 */
class MainActivityWithListener : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var database: FirebaseDatabase
    
    // ID pengguna (dalam implementasi nyata, didapat dari Firebase Auth)
    private val senderId: String = "user123"      // ID pengguna yang sedang login
    private val receiverId: String = "user456"    // ID pengguna tujuan
    
    // Room IDs untuk chat
    private lateinit var senderRoom: String
    private lateinit var receiverRoom: String
    
    // List untuk menyimpan pesan
    private val messageList = ArrayList<MessageModel>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Inisialisasi View Binding
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        
        // Inisialisasi Firebase Database
        database = FirebaseDatabase.getInstance()
        
        // Setup chat rooms
        senderRoom = senderId + receiverId
        receiverRoom = receiverId + senderId
        
        // Setup click listener untuk tombol kirim
        binding.btnSend.setOnClickListener {
            sendMessage()
        }
        
        // Setup listener untuk menerima pesan real-time
        setupMessageListener()
    }
    
    /**
     * Fungsi untuk mengirim pesan real-time ke Firebase Realtime Database
     */
    private fun sendMessage() {
        // 1. Ambil teks dari EditText dan validasi
        val messageText = binding.etMessage.text.toString().trim()
        
        if (messageText.isEmpty()) {
            Toast.makeText(this, "Pesan tidak boleh kosong", Toast.LENGTH_SHORT).show()
            return
        }
        
        // 2. Buat instance MessageModel
        val message = MessageModel(
            uid = senderId,
            message = messageText,
            timestamp = System.currentTimeMillis()
        )
        
        // 3. Dapatkan pushKey unik
        val messagesRef = database.getReference("Chats")
        val pushKey = messagesRef.push().key
        
        if (pushKey == null) {
            Toast.makeText(this, "Gagal membuat ID pesan", Toast.LENGTH_SHORT).show()
            return
        }
        
        // 4. Simpan ke database (multi-path update)
        val updates = hashMapOf<String, Any>(
            "Chats/$senderRoom/messages/$pushKey" to message,
            "Chats/$receiverRoom/messages/$pushKey" to message
        )
        
        database.reference.updateChildren(updates)
            .addOnSuccessListener {
                // 5. Kosongkan input field
                binding.etMessage.setText("")
                Log.d("MainActivity", "Message sent: $pushKey")
            }
            .addOnFailureListener { exception ->
                // 6. Error handling
                Toast.makeText(
                    this, 
                    "Gagal mengirim: ${exception.message}", 
                    Toast.LENGTH_LONG
                ).show()
                Log.e("MainActivity", "Send failed", exception)
            }
    }
    
    /**
     * Setup listener untuk menerima pesan secara real-time
     * 
     * ValueEventListener akan:
     * - Dipanggil pertama kali saat setup (mendapat semua pesan existing)
     * - Dipanggil otomatis setiap kali ada perubahan data
     * - Memberikan snapshot lengkap dari semua pesan di room
     */
    private fun setupMessageListener() {
        val messagesRef = database.getReference("Chats")
            .child(senderRoom)
            .child("messages")
        
        messagesRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                // Clear list sebelum mengisi ulang
                messageList.clear()
                
                // Iterasi semua pesan
                for (messageSnapshot in snapshot.children) {
                    try {
                        // Parse snapshot menjadi MessageModel
                        val message = messageSnapshot.getValue(MessageModel::class.java)
                        
                        if (message != null) {
                            messageList.add(message)
                        }
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Error parsing message", e)
                    }
                }
                
                // Update UI (RecyclerView adapter)
                // adapter.notifyDataSetChanged()
                
                Log.d("MainActivity", "Messages loaded: ${messageList.size}")
                
                // Scroll ke pesan terbaru
                if (messageList.isNotEmpty()) {
                    // binding.rvMessages.scrollToPosition(messageList.size - 1)
                }
            }
            
            override fun onCancelled(error: DatabaseError) {
                // Handle error saat membaca data
                Toast.makeText(
                    this@MainActivityWithListener,
                    "Gagal memuat pesan: ${error.message}",
                    Toast.LENGTH_LONG
                ).show()
                
                Log.e("MainActivity", "Database error: ${error.message}")
            }
        })
    }
    
    /**
     * BONUS: Fungsi untuk menghapus pesan
     */
    private fun deleteMessage(messageId: String) {
        val updates = hashMapOf<String, Any?>(
            "Chats/$senderRoom/messages/$messageId" to null,
            "Chats/$receiverRoom/messages/$messageId" to null
        )
        
        database.reference.updateChildren(updates)
            .addOnSuccessListener {
                Toast.makeText(this, "Pesan dihapus", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener { exception ->
                Toast.makeText(
                    this,
                    "Gagal menghapus: ${exception.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
    }
    
    /**
     * BONUS: Fungsi untuk mengupdate pesan
     */
    private fun updateMessage(messageId: String, newText: String) {
        val updates = hashMapOf<String, Any>(
            "Chats/$senderRoom/messages/$messageId/message" to newText,
            "Chats/$receiverRoom/messages/$messageId/message" to newText
        )
        
        database.reference.updateChildren(updates)
            .addOnSuccessListener {
                Toast.makeText(this, "Pesan diupdate", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener { exception ->
                Toast.makeText(
                    this,
                    "Gagal update: ${exception.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
    }
    
    /**
     * BONUS: Fungsi untuk mengirim typing indicator
     */
    private fun sendTypingIndicator(isTyping: Boolean) {
        database.getReference("Chats")
            .child(senderRoom)
            .child("typing")
            .child(senderId)
            .setValue(isTyping)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Hapus typing indicator saat keluar
        sendTypingIndicator(false)
    }
}
