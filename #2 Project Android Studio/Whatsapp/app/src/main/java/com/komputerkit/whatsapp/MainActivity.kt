package com.komputerkit.whatsapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.ChildEventListener
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.komputerkit.whatsapp.adapters.MessageAdapter
import com.komputerkit.whatsapp.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var database: FirebaseDatabase
    private lateinit var auth: FirebaseAuth
    
    // RecyclerView untuk menampilkan pesan
    private lateinit var messageAdapter: MessageAdapter
    private val messageList = ArrayList<MessageModel>()
    
    // ID pengguna (didapat dari Firebase Auth)
    private lateinit var senderId: String
    private lateinit var receiverId: String    // ID pengguna tujuan (dari intent)
    private var receiverName: String = "User"   // Nama penerima (dari intent)
    
    // Room IDs untuk chat
    private lateinit var senderRoom: String
    private lateinit var receiverRoom: String
    
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
        
        // Inisialisasi Firebase
        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance()
        
        // Cek apakah user sudah login
        val currentUser = auth.currentUser
        if (currentUser == null) {
            // User belum login, redirect ke LoginActivity
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        // Ambil senderId dari current user
        senderId = currentUser.uid
        
        // Ambil receiver data dari intent
        receiverId = intent.getStringExtra("USER_ID") ?: "user456"
        receiverName = intent.getStringExtra("USERNAME") ?: "User"
        
        // Debug logging
        Log.d("MainActivity", "=== CHAT INFO ===")
        Log.d("MainActivity", "SenderId: $senderId")
        Log.d("MainActivity", "ReceiverId: $receiverId")
        Log.d("MainActivity", "ReceiverName: $receiverName")
        
        // Set title dengan nama receiver
        supportActionBar?.title = receiverName
        
        // Setup chat rooms
        // Format: IDpengirim + IDpenerima untuk senderRoom
        // Format: IDpenerima + IDpengirim untuk receiverRoom
        senderRoom = senderId + receiverId
        receiverRoom = receiverId + senderId
        
        Log.d("MainActivity", "SenderRoom: $senderRoom")
        Log.d("MainActivity", "ReceiverRoom: $receiverRoom")
        Log.d("MainActivity", "===================")
        
        // Setup RecyclerView
        setupRecyclerView()
        
        // Load messages dari Firebase
        loadMessages()
        
        // Setup click listener untuk tombol kirim
        binding.btnSend.setOnClickListener {
            sendMessage()
        }
        
        // Long press pada EditText untuk insert test message dari receiver (DEV ONLY)
        binding.etMessage.setOnLongClickListener {
            insertTestMessageFromReceiver()
            true
        }
    }
    
    /**
     * Setup RecyclerView untuk menampilkan pesan
     */
    private fun setupRecyclerView() {
        messageAdapter = MessageAdapter(this, messageList, senderId)
        binding.rvMessages.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = messageAdapter
        }
    }
    
    /**
     * Load messages dari Firebase Realtime Database
     */
    private fun loadMessages() {
        val messagesRef = database.getReference("Chats")
            .child(senderRoom)
            .child("messages")
        
        messagesRef.addChildEventListener(object : ChildEventListener {
            override fun onChildAdded(snapshot: DataSnapshot, previousChildName: String?) {
                val message = snapshot.getValue(MessageModel::class.java)
                if (message != null) {
                    messageList.add(message)
                    messageAdapter.notifyItemInserted(messageList.size - 1)
                    
                    // Scroll ke pesan terbaru
                    binding.rvMessages.scrollToPosition(messageList.size - 1)
                    
                    Log.d("MainActivity", "Message loaded: ${message.message}")
                }
            }
            
            override fun onChildChanged(snapshot: DataSnapshot, previousChildName: String?) {
                // Handle message update jika diperlukan
            }
            
            override fun onChildRemoved(snapshot: DataSnapshot) {
                // Handle message delete jika diperlukan
            }
            
            override fun onChildMoved(snapshot: DataSnapshot, previousChildName: String?) {
                // Not used
            }
            
            override fun onCancelled(error: DatabaseError) {
                Toast.makeText(
                    this@MainActivity, 
                    "Gagal memuat pesan: ${error.message}", 
                    Toast.LENGTH_LONG
                ).show()
                Log.e("MainActivity", "Failed to load messages", error.toException())
            }
        })
    }
    
    /**
     * Fungsi untuk mengirim pesan real-time ke Firebase Realtime Database
     * 
     * Langkah-langkah:
     * 1. Validasi input pesan
     * 2. Buat object MessageModel
     * 3. Generate unique key untuk pesan
     * 4. Simpan ke database (sender & receiver room)
     * 5. Kosongkan input field
     * 6. Handle error jika ada
     */
    private fun sendMessage() {
        // 1. Ambil teks dari EditText dan validasi
        val messageText = binding.etMessage.text.toString().trim()
        
        // Cek apakah pesan kosong
        if (messageText.isEmpty()) {
            Toast.makeText(this, "Pesan tidak boleh kosong", Toast.LENGTH_SHORT).show()
            return
        }
        
        // 2. Buat instance MessageModel baru dengan data yang relevan
        val message = MessageModel(
            uid = senderId,
            message = messageText,
            timestamp = System.currentTimeMillis()
        )
        
        // 3. Dapatkan pushKey unik dari Firebase untuk pesan baru
        val messagesRef = database.getReference("Chats")
        val pushKey = messagesRef.push().key
        
        // Validasi pushKey
        if (pushKey == null) {
            Toast.makeText(this, "Gagal membuat ID pesan", Toast.LENGTH_SHORT).show()
            Log.e("MainActivity", "Failed to generate push key")
            return
        }
        
        // 4. Simpan pesan ke kedua jalur (senderRoom dan receiverRoom) secara bersamaan
        // Menggunakan Map untuk update multi-path
        val updates = hashMapOf<String, Any>(
            // Path untuk sender room
            "Chats/$senderRoom/messages/$pushKey" to message,
            // Path untuk receiver room
            "Chats/$receiverRoom/messages/$pushKey" to message
        )
        
        // Kirim update ke database
        database.reference.updateChildren(updates)
            .addOnSuccessListener {
                // 5. Setelah sukses, kosongkan kolom input pesan
                binding.etMessage.setText("")
                
                Toast.makeText(this, "Pesan terkirim", Toast.LENGTH_SHORT).show()
                Log.d("MainActivity", "Message sent successfully with key: $pushKey")
            }
            .addOnFailureListener { exception ->
                // 6. Error handling jika proses pengiriman gagal
                Toast.makeText(
                    this, 
                    "Gagal mengirim pesan: ${exception.message}", 
                    Toast.LENGTH_LONG
                ).show()
                
                Log.e("MainActivity", "Failed to send message", exception)
            }
    }
    
    /**
     * FUNGSI TEST: Insert pesan dari receiver (untuk simulasi chat 2 arah)
     * Long press pada EditText untuk trigger fungsi ini
     */
    private fun insertTestMessageFromReceiver() {
        val testMessages = listOf(
            "Halo! Apa kabar?",
            "Sedang apa sekarang?",
            "Baik-baik saja kok",
            "Terima kasih sudah menghubungi",
            "Sampai jumpa!"
        )
        
        // Random message
        val randomMessage = testMessages.random()
        
        // Buat message dengan UID dari receiver
        val message = MessageModel(
            uid = receiverId,  // Pakai receiver ID, bukan sender ID
            message = randomMessage,
            timestamp = System.currentTimeMillis()
        )
        
        val messagesRef = database.getReference("Chats")
        val pushKey = messagesRef.push().key
        
        if (pushKey == null) {
            Toast.makeText(this, "Gagal membuat test message", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Simpan ke kedua room
        val updates = hashMapOf<String, Any>(
            "Chats/$senderRoom/messages/$pushKey" to message,
            "Chats/$receiverRoom/messages/$pushKey" to message
        )
        
        database.reference.updateChildren(updates)
            .addOnSuccessListener {
                Toast.makeText(this, "✅ Test message dari $receiverName", Toast.LENGTH_SHORT).show()
                Log.d("MainActivity", "Test message inserted from receiver: $randomMessage")
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "❌ Gagal insert test message", Toast.LENGTH_SHORT).show()
                Log.e("MainActivity", "Failed to insert test message", exception)
            }
    }
}