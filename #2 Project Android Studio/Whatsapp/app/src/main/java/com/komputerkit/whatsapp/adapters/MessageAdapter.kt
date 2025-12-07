package com.komputerkit.whatsapp.adapters

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.whatsapp.MessageModel
import com.komputerkit.whatsapp.R
import com.komputerkit.whatsapp.databinding.ItemMessageReceivedBinding
import com.komputerkit.whatsapp.databinding.ItemMessageSentBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MessageAdapter(
    private val context: Context,
    private val messages: ArrayList<MessageModel>,
    private val senderId: String
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    
    companion object {
        private const val VIEW_TYPE_SENT = 1
        private const val VIEW_TYPE_RECEIVED = 2
    }
    
    // ViewHolder untuk pesan yang dikirim
    inner class SentMessageViewHolder(private val binding: ItemMessageSentBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(message: MessageModel) {
            binding.tvMessage.text = message.message
            binding.tvTime.text = formatTime(message.timestamp)
        }
    }
    
    // ViewHolder untuk pesan yang diterima
    inner class ReceivedMessageViewHolder(private val binding: ItemMessageReceivedBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(message: MessageModel) {
            binding.tvMessage.text = message.message
            binding.tvTime.text = formatTime(message.timestamp)
        }
    }
    
    override fun getItemViewType(position: Int): Int {
        val message = messages[position]
        return if (message.uid == senderId) {
            VIEW_TYPE_SENT
        } else {
            VIEW_TYPE_RECEIVED
        }
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == VIEW_TYPE_SENT) {
            val binding = ItemMessageSentBinding.inflate(
                LayoutInflater.from(parent.context), 
                parent, 
                false
            )
            SentMessageViewHolder(binding)
        } else {
            val binding = ItemMessageReceivedBinding.inflate(
                LayoutInflater.from(parent.context), 
                parent, 
                false
            )
            ReceivedMessageViewHolder(binding)
        }
    }
    
    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val message = messages[position]
        
        when (holder) {
            is SentMessageViewHolder -> holder.bind(message)
            is ReceivedMessageViewHolder -> holder.bind(message)
        }
    }
    
    override fun getItemCount(): Int = messages.size
    
    /**
     * Format timestamp ke format waktu yang readable
     */
    private fun formatTime(timestamp: Long): String {
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
}
