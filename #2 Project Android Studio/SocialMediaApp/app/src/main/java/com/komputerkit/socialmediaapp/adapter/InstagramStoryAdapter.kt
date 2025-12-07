package com.komputerkit.socialmediaapp.adapter

import android.app.AlertDialog
import android.content.Intent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CircleCrop
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.activity.StoryViewerActivity
import com.komputerkit.socialmediaapp.activity.StoryEditorActivity
import com.komputerkit.socialmediaapp.model.UserStories
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

/**
 * Instagram-style Story Adapter with Dedicated Delete Button
 * 
 * Features:
 * - Gets currentUserId from FirebaseAuth (passed from MainActivity)
 * - Shows "+" button ONLY for logged-in user's story (own story)
 * - Shows dedicated delete button (trash icon) ONLY for own stories with content
 * - Hides all buttons for other users' stories
 * - Delete functionality with AlertDialog confirmation
 * - Integrates with FirebaseRepository for real-time delete operations
 * - Automatic RecyclerView refresh after successful deletion
 * 
 * UI Elements:
 * - Add Story Button: Blue "+" icon in bottom-right corner (own stories only)
 * 
 * Delete Story Flow:
 * 1. Long press story profile image (own stories only)
 * 2. AlertDialog appears: "Yakin hapus story ini?" with "Ya, Hapus" (red) or "Batal"
 * 3. If "Ya, Hapus" selected → delete from Firestore by story.id
 * 4. Show Toast feedback and refresh RecyclerView automatically
 * 5. If "Batal" selected → dismiss dialog
 * 
 * Security:
 * - Only story.userID == currentUserId can see and use delete functionality
 * - Other users' stories have no delete functionality at all
 * 
 * Layout Structure:
 * ```xml
 * <FrameLayout> <!-- storyContainer -->
 *   <ImageView/> <!-- profileImage with border -->
 *   <CardView android:id="addStoryIcon" /> <!-- + button bottom-right -->
 * </FrameLayout>
 * <TextView/> <!-- userName -->
 * ```
 */

import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.util.ImageLoaderUtil

class InstagramStoryAdapter(
    private var userStoriesList: List<UserStories>,
    private val currentUserId: String,
    private val onLongPressOwnStory: (UserStories) -> Unit,
    private val firebaseRepository: FirebaseRepository,
    private val getUserForId: (String) -> LiveData<User?>,
    private val lifecycleOwner: LifecycleOwner
) : RecyclerView.Adapter<InstagramStoryAdapter.StoryViewHolder>() {

    private var onUserStoryClick: ((UserStories) -> Unit)? = null
    private var onAddStoryClick: (() -> Unit)? = null
    private var onStoryDeleted: (() -> Unit)? = null

    fun setOnUserStoryClickListener(listener: (UserStories) -> Unit) {
        onUserStoryClick = listener
    }

    fun setOnAddStoryClickListener(listener: () -> Unit) {
        onAddStoryClick = listener
    }
    
    fun setOnStoryDeletedListener(listener: () -> Unit) {
        onStoryDeleted = listener
    }

    companion object {
        private const val VIEW_TYPE_OWN_STORY = 1
        private const val VIEW_TYPE_OTHER_STORY = 2
    }

    inner class StoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profileImage: ImageView = itemView.findViewById(R.id.profileImage)
        val storyBorder: View = itemView.findViewById(R.id.storyBorder)
        val addStoryIcon: CardView = itemView.findViewById(R.id.addStoryIcon)
        val userName: TextView = itemView.findViewById(R.id.userName)
        val storyContainer: View = itemView.findViewById(R.id.storyContainer)

        fun bind(userStories: UserStories, isOwnStory: Boolean) {
            // Lookup user data realtime
            getUserForId(userStories.userId).observe(lifecycleOwner) { user ->
                if (user != null) {
                    userName.text = user.username
                    ImageLoaderUtil.load(profileImage, user.profileImageUrl)
                } else {
                    userName.text = "Unknown"
                    profileImage.setImageResource(R.drawable.ic_person)
                }
            }

            // Configure story border (gradient for unviewed, gray for viewed)
            storyBorder.isSelected = userStories.hasUnviewedStories

            if (isOwnStory) {
                setupOwnStoryListener(userStories)
                // Always show add icon for own story (small "+" button in corner)
                addStoryIcon.visibility = View.VISIBLE
            } else {
                setupOtherStoryListener(userStories)
                // Never show add icon for other users' stories
                addStoryIcon.visibility = View.GONE
            }
        }

        private fun setupOwnStoryListener(userStories: UserStories) {
            // Click on profile image - view own stories (if any exist)
            storyContainer.setOnClickListener {
                if (userStories.stories.isNotEmpty()) {
                    // Open StoryViewerActivity to show own stories
                    onUserStoryClick?.invoke(userStories)
                }
            }

            // Click on add icon ("+") - create new story
            addStoryIcon.setOnClickListener {
                // Open StoryEditorActivity to add new story
                onAddStoryClick?.invoke()
            }

            // Long press on profile image - delete story options (alternative method)
            storyContainer.setOnLongClickListener {
                if (userStories.stories.isNotEmpty()) {
                    showDeleteStoryDialog(userStories)
                }
                true
            }
        }
        
        private fun showDeleteStoryDialog(userStories: UserStories) {
            val context = itemView.context
            
            // Create AlertDialog for delete confirmation
            val builder = AlertDialog.Builder(context)
            builder.setTitle("Hapus Story")
            builder.setMessage("Yakin hapus story ini? Tindakan ini tidak dapat dibatalkan.")
            
            // Tombol "Ya, Hapus"
            builder.setPositiveButton("Ya, Hapus") { dialog, _ ->
                dialog.dismiss()
                deleteUserStories(userStories)
            }
            
            // Tombol "Batal"
            builder.setNegativeButton("Batal") { dialog, _ ->
                dialog.dismiss()
            }
            
            // Customize dialog appearance
            val dialog = builder.create()
            dialog.show()
            
            // Make delete button red
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(
                context.resources.getColor(android.R.color.holo_red_dark, null)
            )
        }
        
        private fun deleteUserStories(userStories: UserStories) {
            val context = itemView.context
            
            // Show loading toast
            Toast.makeText(context, "Menghapus story...", Toast.LENGTH_SHORT).show()
            
            // Delete all stories from this user (usually there's only one recent story)
            val storiesToDelete = userStories.stories
            var deletedCount = 0
            val totalStories = storiesToDelete.size
            
            if (totalStories == 0) {
                Toast.makeText(context, "Tidak ada story untuk dihapus", Toast.LENGTH_SHORT).show()
                return
            }
            
            // Delete each story from Firestore
            storiesToDelete.forEach { story ->
                firebaseRepository.deleteStory(story.id) { success ->
                    deletedCount++
                    
                    if (success) {
                        // If this is the last story being deleted
                        if (deletedCount == totalStories) {
                            // Show success message
                            Toast.makeText(context, "Story berhasil dihapus", Toast.LENGTH_SHORT).show()
                            
                            // Notify that story was deleted to refresh the RecyclerView
                            onStoryDeleted?.invoke()
                        }
                    } else {
                        Toast.makeText(context, "Gagal menghapus story", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }

        private fun setupOtherStoryListener(userStories: UserStories) {
            // Click on other user's profile image - view their stories
            storyContainer.setOnClickListener {
                if (userStories.stories.isNotEmpty()) {
                    // Open StoryViewerActivity to show other user's stories
                    onUserStoryClick?.invoke(userStories)
                }
            }
            
            // No long press functionality for other users' stories
            storyContainer.setOnLongClickListener(null)
        }
    }

    override fun getItemViewType(position: Int): Int {
        val userStories = userStoriesList[position]
        return if (userStories.userId == currentUserId) {
            VIEW_TYPE_OWN_STORY
        } else {
            VIEW_TYPE_OTHER_STORY
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_story_instagram, parent, false)
        return StoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: StoryViewHolder, position: Int) {
        val userStories = userStoriesList[position]
        val isOwnStory = userStories.userId == currentUserId
        holder.bind(userStories, isOwnStory)
    }

    override fun getItemCount(): Int = userStoriesList.size

    fun updateStories(newUserStoriesList: List<UserStories>) {
        userStoriesList = newUserStoriesList
        notifyDataSetChanged()
    }
    
    fun updateUserStories(newUserStoriesList: List<UserStories>) {
        userStoriesList = newUserStoriesList
        notifyDataSetChanged()
    }

    fun markUserStoriesAsViewed(userId: String) {
        val position = userStoriesList.indexOfFirst { it.userId == userId }
        if (position != -1) {
            notifyItemChanged(position)
        }
    }
}
