package com.komputerkit.socialmediaapp.adapter

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.Comment

class CommentsAdapter(
    private var comments: List<Comment>,
    private val currentUserId: String,
    private val onProfileClick: (String) -> Unit,
    private val onDeleteClick: (Comment) -> Unit
) : RecyclerView.Adapter<CommentsAdapter.CommentViewHolder>() {

    inner class CommentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profileImage: ImageView = itemView.findViewById(R.id.profileImage)
        val usernameText: TextView = itemView.findViewById(R.id.usernameText)
        val commentText: TextView = itemView.findViewById(R.id.commentText)
        val timeText: TextView = itemView.findViewById(R.id.timeText)
        val deleteButton: ImageButton = itemView.findViewById(R.id.deleteButton)

        fun bind(comment: Comment) {
            Log.d("CommentsAdapter", "Binding comment: ${comment.userName} - ${comment.text}")
            
            usernameText.text = comment.userName
            commentText.text = comment.text
            timeText.text = formatTimestamp(comment.timestamp)

            // Show delete button only for current user's comments
            if (comment.userId == currentUserId) {
                deleteButton.visibility = View.VISIBLE
                deleteButton.setOnClickListener {
                    onDeleteClick(comment)
                }
            } else {
                deleteButton.visibility = View.GONE
                deleteButton.setOnClickListener(null)
            }

            // Load profile image
            if (comment.userProfileImage.isNotEmpty()) {
                Glide.with(itemView.context)
                    .load(comment.userProfileImage)
                    .placeholder(R.drawable.circle_background)
                    .error(R.drawable.circle_background)
                    .into(profileImage)
            } else {
                profileImage.setImageResource(R.drawable.circle_background)
            }

            // Profile click listener
            profileImage.setOnClickListener {
                onProfileClick(comment.userId)
            }
            usernameText.setOnClickListener {
                onProfileClick(comment.userId)
            }
        }

        private fun formatTimestamp(timestamp: Long): String {
            val now = System.currentTimeMillis()
            val diff = now - timestamp
            
            return when {
                diff < 60000 -> "now"
                diff < 3600000 -> "${diff / 60000}m"
                diff < 86400000 -> "${diff / 3600000}h"
                diff < 604800000 -> "${diff / 86400000}d"
                else -> "${diff / 604800000}w"
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CommentViewHolder {
        Log.d("CommentsAdapter", "Creating view holder")
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_comment, parent, false)
        return CommentViewHolder(view)
    }

    override fun onBindViewHolder(holder: CommentViewHolder, position: Int) {
        Log.d("CommentsAdapter", "Binding view holder at position $position")
        holder.bind(comments[position])
    }

    override fun getItemCount(): Int {
        Log.d("CommentsAdapter", "Item count: ${comments.size}")
        return comments.size
    }

    fun updateComments(newComments: List<Comment>) {
        Log.d("CommentsAdapter", "📊 updateComments START - current: ${comments.size}, new: ${newComments.size}")
        
        // Log each comment for debugging
        newComments.forEachIndexed { index, comment ->
            Log.d("CommentsAdapter", "📝 New comment $index: ${comment.userName} - ${comment.text}")
        }
        
        // Ensure we have a valid list
        if (newComments.isEmpty()) {
            Log.d("CommentsAdapter", "⚠️ Received empty comments list")
        }
        
        comments = newComments.toMutableList()
        notifyDataSetChanged()
        
        Log.d("CommentsAdapter", "✅ updateComments COMPLETE - final count: ${comments.size}")
    }
    
    fun addComment(comment: Comment) {
        Log.d("CommentsAdapter", "Adding new comment from ${comment.userName}")
        val mutableComments = comments.toMutableList()
        mutableComments.add(0, comment) // Add at top for latest first
        comments = mutableComments
        notifyItemInserted(0)
    }
}
