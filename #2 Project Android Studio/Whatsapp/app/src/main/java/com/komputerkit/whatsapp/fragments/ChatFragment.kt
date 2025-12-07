package com.komputerkit.whatsapp.fragments

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.*
import com.komputerkit.whatsapp.ChatListModel
import com.komputerkit.whatsapp.MainActivity
import com.komputerkit.whatsapp.adapters.ChatAdapter
import com.komputerkit.whatsapp.databinding.FragmentChatBinding

/**
 * Fragment untuk menampilkan daftar chat
 */
class ChatFragment : Fragment() {
    
    private var _binding: FragmentChatBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var auth: FirebaseAuth
    private lateinit var database: FirebaseDatabase
    private lateinit var chatAdapter: ChatAdapter
    private val chatList = ArrayList<ChatListModel>()
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentChatBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance()
        
        // Setup RecyclerView
        setupRecyclerView()
        
        // Load chats
        loadChats()
    }
    
    private fun setupRecyclerView() {
        chatAdapter = ChatAdapter(chatList) { chat ->
            // On chat item click
            openChatActivity(chat)
        }
        
        binding.rvChats.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = chatAdapter
        }
    }
    
    private fun loadChats() {
        val currentUserId = auth.currentUser?.uid ?: return
        
        // TODO: Load real chats from Firebase
        // For now, show sample data
        loadSampleChats()
    }
    
    private fun loadSampleChats() {
        // Sample data untuk testing
        chatList.clear()
        chatList.addAll(
            listOf(
                ChatListModel(
                    chatId = "chat1",
                    userId = "user456",
                    username = "John Doe",
                    profileImage = "",
                    lastMessage = "Hello, how are you?",
                    lastMessageTime = System.currentTimeMillis() - 3600000,
                    unreadCount = 2
                ),
                ChatListModel(
                    chatId = "chat2",
                    userId = "user789",
                    username = "Jane Smith",
                    profileImage = "",
                    lastMessage = "See you tomorrow!",
                    lastMessageTime = System.currentTimeMillis() - 7200000,
                    unreadCount = 0
                ),
                ChatListModel(
                    chatId = "chat3",
                    userId = "user321",
                    username = "Bob Wilson",
                    profileImage = "",
                    lastMessage = "Thanks for your help",
                    lastMessageTime = System.currentTimeMillis() - 86400000,
                    unreadCount = 1
                )
            )
        )
        
        chatAdapter.notifyDataSetChanged()
        
        // Update empty state
        if (chatList.isEmpty()) {
            binding.emptyState.visibility = View.VISIBLE
            binding.rvChats.visibility = View.GONE
        } else {
            binding.emptyState.visibility = View.GONE
            binding.rvChats.visibility = View.VISIBLE
        }
    }
    
    private fun openChatActivity(chat: ChatListModel) {
        Log.d("ChatFragment", "Opening chat with: ${chat.username}")
        
        // Navigate to MainActivity (chat screen) with user data
        val intent = Intent(requireContext(), MainActivity::class.java).apply {
            putExtra("USER_ID", chat.userId)
            putExtra("USERNAME", chat.username)
        }
        startActivity(intent)
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
