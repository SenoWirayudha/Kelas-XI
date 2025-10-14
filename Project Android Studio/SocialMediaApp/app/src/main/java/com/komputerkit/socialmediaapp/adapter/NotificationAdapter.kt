package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.Notification
import com.komputerkit.socialmediaapp.model.NotificationTypes
import com.komputerkit.socialmediaapp.model.getDisplayMessage
import com.komputerkit.socialmediaapp.model.getTimeAgo

class NotificationAdapter(
    private var notifications: List<Notification>,
    private val onNotificationClick: (Notification) -> Unit
) : RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder>() {

    inner class NotificationViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val userProfileImage: ImageView = itemView.findViewById(R.id.userProfileImage)
        val notificationIcon: ImageView = itemView.findViewById(R.id.notificationIcon)
        val message: TextView = itemView.findViewById(R.id.message)
        val timestamp: TextView = itemView.findViewById(R.id.timestamp)
        val unreadIndicator: View = itemView.findViewById(R.id.unreadIndicator)
        val postThumbnail: ImageView = itemView.findViewById(R.id.postThumbnail)

        fun bind(notification: Notification) {
            android.util.Log.d("NotificationAdapter", "Binding notification: ${notification.id}, type: ${notification.type}, message: ${notification.message}, fromUser: ${notification.fromUserName}, isRead: ${notification.isRead}")
            
            message.text = notification.getDisplayMessage()
            timestamp.text = notification.getTimeAgo()
            
            // Show/hide unread indicator
            unreadIndicator.visibility = if (notification.isRead) View.GONE else View.VISIBLE
            
            // Load user profile image
            Glide.with(itemView.context)
                .load(notification.fromUserProfileImage)
                .placeholder(R.drawable.ic_person)
                .error(R.drawable.ic_person)
                .circleCrop()
                .into(userProfileImage)
            
            // Set notification type icon
            when (notification.type) {
                "like" -> {
                    notificationIcon.setImageResource(R.drawable.ic_heart_filled)
                    notificationIcon.setColorFilter(itemView.context.getColor(android.R.color.holo_red_dark))
                }
                "comment" -> {
                    notificationIcon.setImageResource(R.drawable.ic_comment)
                    notificationIcon.setColorFilter(itemView.context.getColor(android.R.color.holo_blue_dark))
                }
                "follow" -> {
                    notificationIcon.setImageResource(R.drawable.ic_person_add)
                    notificationIcon.setColorFilter(itemView.context.getColor(android.R.color.holo_green_dark))
                }
                else -> {
                    notificationIcon.setImageResource(R.drawable.ic_notifications)
                    notificationIcon.setColorFilter(itemView.context.getColor(android.R.color.darker_gray))
                }
            }
            
            // Show post thumbnail if available and it's a post-related notification
            if (!notification.postId.isNullOrEmpty() && 
                (notification.type == NotificationTypes.LIKE || notification.type == NotificationTypes.COMMENT)) {
                postThumbnail.visibility = View.VISIBLE
                // For now, we'll use a placeholder until we implement post thumbnail loading
                // In a full implementation, you'd load the post data to get the image
                Glide.with(itemView.context)
                    .load(R.drawable.ic_launcher_foreground)
                    .placeholder(R.drawable.ic_launcher_foreground)
                    .error(R.drawable.ic_launcher_foreground)
                    .centerCrop()
                    .into(postThumbnail)
            } else {
                postThumbnail.visibility = View.GONE
            }
            
            // Set background color based on read status
            itemView.setBackgroundColor(
                if (notification.isRead) 
                    itemView.context.getColor(android.R.color.transparent)
                else 
                    itemView.context.getColor(R.color.notification_unread_background)
            )

            itemView.setOnClickListener {
                onNotificationClick(notification)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NotificationViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_notification, parent, false)
        return NotificationViewHolder(view)
    }

    override fun onBindViewHolder(holder: NotificationViewHolder, position: Int) {
        holder.bind(notifications[position])
    }

    override fun getItemCount(): Int = notifications.size

    fun updateNotifications(newNotifications: List<Notification>) {
        android.util.Log.d("NotificationAdapter", "Updating notifications: ${newNotifications.size} items")
        newNotifications.forEachIndexed { index, notification ->
            android.util.Log.d("NotificationAdapter", "[$index] ${notification.id}: ${notification.getDisplayMessage()}")
        }
        notifications = newNotifications
        notifyDataSetChanged()
    }
}
