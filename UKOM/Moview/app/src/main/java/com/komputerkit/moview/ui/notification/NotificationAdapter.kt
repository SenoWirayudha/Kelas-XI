package com.komputerkit.moview.ui.notification

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Notification
import com.komputerkit.moview.data.model.NotificationSection
import com.komputerkit.moview.databinding.ItemNotificationBinding

class NotificationAdapter : RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder>() {
    
    private var notifications: List<Notification> = emptyList()
    
    fun submitList(list: List<Notification>) {
        notifications = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NotificationViewHolder {
        val binding = ItemNotificationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return NotificationViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: NotificationViewHolder, position: Int) {
        holder.bind(notifications[position], position)
    }
    
    override fun getItemCount(): Int = notifications.size
    
    inner class NotificationViewHolder(
        private val binding: ItemNotificationBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(notification: Notification, position: Int) {
            // Show section header if first item or section changed
            if (position == 0 || notifications[position - 1].section != notification.section) {
                binding.sectionHeader.visibility = View.VISIBLE
                binding.sectionHeader.text = when (notification.section) {
                    NotificationSection.TODAY -> "Today"
                    NotificationSection.YESTERDAY -> "Yesterday"
                    NotificationSection.LAST_WEEK -> "Last Week"
                }
            } else {
                binding.sectionHeader.visibility = View.GONE
            }
            
            // User avatar
            Glide.with(binding.root.context)
                .load(notification.userAvatar)
                .placeholder(R.drawable.ic_profile)
                .into(binding.ivUserAvatar)
            
            // Message and time
            binding.tvMessage.text = notification.message
            binding.tvTime.text = notification.time
            
            // Movie poster (if applicable)
            if (notification.moviePoster != null) {
                binding.ivMoviePoster.visibility = View.VISIBLE
                Glide.with(binding.root.context)
                    .load(notification.moviePoster)
                    .into(binding.ivMoviePoster)
            } else {
                binding.ivMoviePoster.visibility = View.GONE
            }
            
            // Unread indicator
            binding.unreadIndicator.visibility = if (!notification.isRead) View.VISIBLE else View.GONE
        }
    }
}
