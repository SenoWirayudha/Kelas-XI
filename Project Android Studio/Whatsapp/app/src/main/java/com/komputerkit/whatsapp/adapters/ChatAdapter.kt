package com.komputerkit.whatsapp.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.whatsapp.ChatListModel
import com.komputerkit.whatsapp.databinding.ItemChatBinding
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.abs

/**
 * Adapter untuk daftar chat
 */
class ChatAdapter(
    private val chatList: ArrayList<ChatListModel>,
    private val onChatClick: (ChatListModel) -> Unit
) : RecyclerView.Adapter<ChatAdapter.ChatViewHolder>() {
    
    inner class ChatViewHolder(val binding: ItemChatBinding) : RecyclerView.ViewHolder(binding.root)
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChatViewHolder {
        val binding = ItemChatBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ChatViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: ChatViewHolder, position: Int) {
        val chat = chatList[position]
        
        with(holder.binding) {
            // Set username
            tvUsername.text = chat.username
            
            // Set last message
            tvLastMessage.text = chat.lastMessage
            
            // Set time
            tvTime.text = formatTime(chat.lastMessageTime)
            
            // Set unread count
            if (chat.unreadCount > 0) {
                tvUnreadCount.visibility = View.VISIBLE
                tvUnreadCount.text = chat.unreadCount.toString()
            } else {
                tvUnreadCount.visibility = View.GONE
            }
            
            // TODO: Load profile image with Glide/Picasso
            // For now, use default icon
            
            // Click listener
            root.setOnClickListener {
                onChatClick(chat)
            }
        }
    }
    
    override fun getItemCount(): Int = chatList.size
    
    /**
     * Format waktu menjadi format yang mudah dibaca
     */
    private fun formatTime(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        
        return when {
            diff < 60000 -> "Baru saja" // < 1 menit
            diff < 3600000 -> "${diff / 60000} menit" // < 1 jam
            diff < 86400000 -> { // < 1 hari
                val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
                sdf.format(Date(timestamp))
            }
            diff < 604800000 -> { // < 1 minggu
                val days = (diff / 86400000).toInt()
                if (days == 1) "Kemarin" else "$days hari"
            }
            else -> { // > 1 minggu
                val sdf = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                sdf.format(Date(timestamp))
            }
        }
    }
}
