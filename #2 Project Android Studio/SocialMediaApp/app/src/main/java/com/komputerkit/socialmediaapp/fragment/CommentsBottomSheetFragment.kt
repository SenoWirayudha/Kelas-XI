package com.komputerkit.socialmediaapp.fragment

import android.app.AlertDialog
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.adapter.CommentsAdapter
import com.komputerkit.socialmediaapp.databinding.BottomSheetCommentsBinding
import com.komputerkit.socialmediaapp.model.Comment
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.google.firebase.auth.FirebaseAuth

class CommentsBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: BottomSheetCommentsBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var firebaseRepository: FirebaseRepository
    private lateinit var commentsAdapter: CommentsAdapter
    private var commentsListener: ListenerRegistration? = null
    
    private var postId: String = ""
    private var currentUserId: String = ""
    private var onProfileClick: ((String) -> Unit)? = null

    companion object {
        private const val ARG_POST_ID = "post_id"
        
        fun newInstance(postId: String): CommentsBottomSheetFragment {
            val fragment = CommentsBottomSheetFragment()
            val args = Bundle()
            args.putString(ARG_POST_ID, postId)
            fragment.arguments = args
            return fragment
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        postId = arguments?.getString(ARG_POST_ID) ?: ""
        currentUserId = FirebaseAuth.getInstance().currentUser?.uid ?: ""
        firebaseRepository = FirebaseRepository()
        
        Log.d("CommentsBottomSheet", "onCreate - postId: $postId, currentUserId: $currentUserId")
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        Log.d("CommentsBottomSheet", "🟡 onCreateView")
        _binding = BottomSheetCommentsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        Log.d("CommentsBottomSheet", "🔵 onViewCreated - postId: '$postId', userId: '$currentUserId'")
        
        if (postId.isEmpty()) {
            Log.e("CommentsBottomSheet", "❌ PostId is empty! Fragment arguments: ${arguments}")
            return
        }
        
        setupRecyclerView()
        setupCommentInput()
        loadCurrentUserProfile()
        loadComments()
    }

    private fun setupRecyclerView() {
        Log.d("CommentsBottomSheet", "🛠️ setupRecyclerView")
        
        commentsAdapter = CommentsAdapter(
            comments = emptyList(),
            currentUserId = currentUserId,
            onProfileClick = { userId ->
                onProfileClick?.invoke(userId)
                dismiss() // Close bottom sheet when navigating to profile
            },
            onDeleteClick = { comment ->
                showDeleteConfirmationDialog(comment)
            }
        )
        
        binding.commentsRecyclerView.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = commentsAdapter
        }
        
        Log.d("CommentsBottomSheet", "✅ RecyclerView setup complete - adapter item count: ${commentsAdapter.itemCount}")
    }

    private fun setupCommentInput() {
        // Enable/disable send button based on text input
        binding.commentEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val hasText = !s.isNullOrBlank()
                binding.sendCommentButton.isEnabled = hasText
                binding.sendCommentButton.alpha = if (hasText) 1.0f else 0.5f
            }
        })

        binding.sendCommentButton.setOnClickListener {
            sendComment()
        }
    }

    private fun loadCurrentUserProfile() {
        firebaseRepository.getUser(currentUserId) { user ->
            activity?.runOnUiThread {
                if (user != null && user.profileImageUrl.isNotEmpty()) {
                    Glide.with(this@CommentsBottomSheetFragment)
                        .load(user.profileImageUrl)
                        .placeholder(R.drawable.circle_background)
                        .error(R.drawable.circle_background)
                        .into(binding.currentUserProfileImage)
                }
            }
        }
    }

    private fun loadComments() {
        Log.d("CommentsBottomSheet", "📥 loadComments START - postId: '$postId'")
        
        if (postId.isEmpty()) {
            Log.e("CommentsBottomSheet", "❌ Cannot load comments: postId is empty")
            return
        }
        
        // Remove previous listener to avoid multiple listeners
        if (commentsListener != null) {
            Log.d("CommentsBottomSheet", "🗑️ Removing previous listener")
            commentsListener?.remove()
            commentsListener = null
        }
        
        Log.d("CommentsBottomSheet", "🎯 Setting up new listener for postId: '$postId'")
        commentsListener = firebaseRepository.getCommentsForPost(postId) { comments ->
            Log.d("CommentsBottomSheet", "📨 Callback received - comments count: ${comments.size}")
            
            // Check if fragment is still attached
            if (!isAdded || activity == null) {
                Log.w("CommentsBottomSheet", "⚠️ Fragment not attached, skipping UI update")
                return@getCommentsForPost
            }
            
            activity?.runOnUiThread {
                Log.d("CommentsBottomSheet", "🔄 Running on UI thread")
                
                comments.forEachIndexed { index, comment ->
                    Log.d("CommentsBottomSheet", "📝 Comment $index: ${comment.userName} - ${comment.text}")
                }
                
                Log.d("CommentsBottomSheet", "📊 Before update - adapter count: ${commentsAdapter.itemCount}")
                commentsAdapter.updateComments(comments)
                Log.d("CommentsBottomSheet", "📊 After update - adapter count: ${commentsAdapter.itemCount}")
                
                binding.commentsCountText.text = comments.size.toString()
                
                // Scroll to bottom to show latest comments
                if (comments.isNotEmpty()) {
                    binding.commentsRecyclerView.post {
                        binding.commentsRecyclerView.scrollToPosition(comments.size - 1)
                        Log.d("CommentsBottomSheet", "📜 Scrolled to position: ${comments.size - 1}")
                    }
                }
                
                Log.d("CommentsBottomSheet", "✅ loadComments UI update COMPLETE")
            }
        }
        
        Log.d("CommentsBottomSheet", "🎯 Listener registered successfully")
    }

    private fun sendComment() {
        val commentText = binding.commentEditText.text.toString().trim()
        if (commentText.isEmpty()) return

        Log.d("CommentsBottomSheet", "Sending comment: '$commentText' for postId: $postId")
        
        // Disable send button while processing
        binding.sendCommentButton.isEnabled = false
        binding.sendCommentButton.alpha = 0.5f

        firebaseRepository.getUser(currentUserId) { user ->
            if (user == null) {
                Log.e("CommentsBottomSheet", "User not found for userId: $currentUserId")
                activity?.runOnUiThread {
                    binding.sendCommentButton.isEnabled = true
                    binding.sendCommentButton.alpha = 1.0f
                }
                return@getUser
            }

            Log.d("CommentsBottomSheet", "User found: ${user.username}, creating comment...")
            
            val comment = Comment(
                postId = postId,
                userId = user.id,
                userName = user.username,
                userProfileImage = user.profileImageUrl,
                text = commentText,
                timestamp = System.currentTimeMillis()
            )

            Log.d("CommentsBottomSheet", "Adding comment to Firestore: $comment")

            firebaseRepository.addComment(comment) { success ->
                activity?.runOnUiThread {
                    binding.sendCommentButton.isEnabled = true
                    
                    if (success) {
                        Log.d("CommentsBottomSheet", "✅ Comment added successfully!")
                        binding.commentEditText.text.clear()
                        binding.sendCommentButton.alpha = 0.5f // Will be re-enabled by TextWatcher
                        
                        // Force reload comments as fallback if real-time doesn't work
                        Log.d("CommentsBottomSheet", "🔄 Force reloading comments...")
                        loadComments()
                    } else {
                        Log.e("CommentsBottomSheet", "❌ Failed to add comment")
                        binding.sendCommentButton.alpha = 1.0f
                    }
                }
            }
        }
    }

    fun setOnProfileClickListener(listener: (String) -> Unit) {
        onProfileClick = listener
    }

    private fun showDeleteConfirmationDialog(comment: Comment) {
        context?.let { ctx ->
            AlertDialog.Builder(ctx)
                .setTitle("Delete Comment")
                .setMessage("Are you sure you want to delete this comment?")
                .setPositiveButton("Delete") { _, _ ->
                    deleteComment(comment)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun deleteComment(comment: Comment) {
        Log.d("CommentsBottomSheet", "🗑️ Deleting comment: ${comment.id}")
        
        firebaseRepository.deleteComment(comment.id) { success ->
            activity?.runOnUiThread {
                if (success) {
                    Log.d("CommentsBottomSheet", "✅ Comment deleted successfully")
                    // Real-time listener will automatically update the UI
                } else {
                    Log.e("CommentsBottomSheet", "❌ Failed to delete comment")
                    // Could show error message to user here
                }
            }
        }
    }

    override fun onDestroyView() {
        Log.d("CommentsBottomSheet", "🔴 onDestroyView - removing listener")
        super.onDestroyView()
        commentsListener?.remove()
        _binding = null
        Log.d("CommentsBottomSheet", "🔴 onDestroyView COMPLETE")
    }
}
