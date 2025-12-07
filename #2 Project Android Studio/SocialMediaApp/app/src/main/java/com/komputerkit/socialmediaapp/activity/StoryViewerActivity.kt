package com.komputerkit.socialmediaapp.activity

import android.animation.ObjectAnimator
import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.bumptech.glide.Glide
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.databinding.ActivityStoryViewerBinding
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.utils.base64ToBitmap
import com.komputerkit.socialmediaapp.viewmodel.UserViewModel
import com.komputerkit.socialmediaapp.util.ImageLoaderUtil
import androidx.lifecycle.ViewModelProvider

class StoryViewerActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityStoryViewerBinding
    private lateinit var firebaseRepository: FirebaseRepository
    private lateinit var auth: FirebaseAuth
    private lateinit var deleteStoryButton: CardView
    private lateinit var userViewModel: UserViewModel
    private var userLiveData: androidx.lifecycle.LiveData<com.komputerkit.socialmediaapp.model.User?>? = null
    
    private var stories: List<Story> = emptyList()
    private var currentStoryIndex = 0
    private var currentUserId: String = ""
    private var loggedInUserId: String = "" // Current logged-in user from Firebase Auth
    
    // For cross-user navigation
    private var allUsers: List<String> = emptyList() // List of userIds that have stories
    private var currentUserIndex = 0 // Index in allUsers list
    private var allStoriesMap: Map<String, List<Story>> = emptyMap() // Map of userId to their stories
    
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null
    private var progressAnimator: ObjectAnimator? = null
    private var storiesListener: ListenerRegistration? = null
    private var isActivityDestroyed = false
    private var isPaused = false
    private var isHolding = false // New state for hold gesture
    private var pausedProgress = 0

    companion object {
        const val EXTRA_STORY_ID = "story_id"
        const val EXTRA_USER_ID = "user_id"
        const val STORY_DURATION = 5000L // 5 seconds per story
    }    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("StoryViewer", "onCreate started")
        
        binding = ActivityStoryViewerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        firebaseRepository = FirebaseRepository()
        auth = FirebaseAuth.getInstance()
        userViewModel = ViewModelProvider(this)[UserViewModel::class.java]
        
        // Get logged-in user ID
        loggedInUserId = auth.currentUser?.uid ?: ""
        
        val storyId = intent.getStringExtra(EXTRA_STORY_ID) ?: ""
        currentUserId = intent.getStringExtra(EXTRA_USER_ID) ?: ""
        
        Log.d("StoryViewer", "StoryId: $storyId, UserId: $currentUserId, LoggedInUserId: $loggedInUserId")
        
        setupUI()
        setupDeleteButton()
        loadStoriesForUser(storyId)
        
        Log.d("StoryViewer", "onCreate completed")
    }
    
    private fun setupFullscreen() {
        // Removed - handled by theme in AndroidManifest
    }
    
    private fun setupUI() {
        binding.closeButton.setOnClickListener {
            // Don't allow exit when in hold mode
            if (isHolding) {
                Log.d("StoryViewer", "Ignoring close button - in hold mode")
                return@setOnClickListener
            }
            handleExit("close_button")
        }
        
        // Setup touch areas for navigation and pause/resume
        setupTouchAreas()
    }
    
    private fun setupDeleteButton() {
        deleteStoryButton = binding.deleteStoryButton
        
        deleteStoryButton.setOnClickListener {
            showDeleteConfirmationDialog()
        }
    }
    
    private fun updateDeleteButtonVisibility() {
        if (stories.isNotEmpty()) {
            val currentStory = stories[currentStoryIndex]
            // Show delete button only if current story belongs to logged-in user
            deleteStoryButton.visibility = if (currentStory.userId == loggedInUserId) {
                View.VISIBLE
            } else {
                View.GONE
            }
        } else {
            deleteStoryButton.visibility = View.GONE
        }
    }
    
    private fun showDeleteConfirmationDialog() {
        if (stories.isEmpty()) return
        
        val currentStory = stories[currentStoryIndex]
        
        // Pause story progress while showing dialog
        pauseStory()
        
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Hapus Story")
        builder.setMessage("Yakin hapus story ini? Tindakan ini tidak dapat dibatalkan.")
        
        // Tombol "Ya, Hapus" (warna merah)
        builder.setPositiveButton("Ya, Hapus") { dialog, _ ->
            dialog.dismiss()
            deleteCurrentStory(currentStory)
        }
        
        // Tombol "Batal"
        builder.setNegativeButton("Batal") { dialog, _ ->
            dialog.dismiss()
            // Resume story progress
            resumeStory()
        }
        
        val dialog = builder.create()
        dialog.show()
        
        // Make delete button red
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(
            resources.getColor(android.R.color.holo_red_dark, null)
        )
        
        // Handle dialog cancellation (back button or outside touch)
        dialog.setOnCancelListener {
            resumeStory()
        }
    }
    
    private fun deleteCurrentStory(story: Story) {
        Toast.makeText(this, "Menghapus story...", Toast.LENGTH_SHORT).show()
        
        firebaseRepository.deleteStory(story.id) { success ->
            runOnUiThread {
                if (success) {
                    Toast.makeText(this, "Story berhasil dihapus", Toast.LENGTH_SHORT).show()
                    
                    // Close activity and return result to refresh the story list
                    val resultIntent = Intent()
                    resultIntent.putExtra("story_deleted", true)
                    setResult(RESULT_OK, resultIntent)
                    finish()
                } else {
                    Toast.makeText(this, "Gagal menghapus story", Toast.LENGTH_SHORT).show()
                    // Resume story if delete failed
                    resumeStory()
                }
            }
        }
    }
    
    
    private fun setupTouchAreas() {
        Log.d("StoryViewer", "Setting up touch areas for navigation")
        
        // Remove click listeners and use custom touch listeners for all areas
        setupCustomTouchListener()
        
        Log.d("StoryViewer", "Touch areas setup complete")
    }
    
    private fun setupCustomTouchListener() {
        // Universal touch detection for all touch areas and story image
        var startY = 0f
        var startX = 0f
        var startTime = 0L
        var isMoving = false
        var holdTriggered = false
        val SWIPE_THRESHOLD = 80f
        val HOLD_THRESHOLD = 150L // Further reduced for better detection
        val MOVEMENT_THRESHOLD = 25f // Increased tolerance for hold
        val TAP_MAX_DURATION = 200L
        
        // Handler for hold detection
        val holdHandler = Handler(Looper.getMainLooper())
        var holdRunnable: Runnable? = null
        
        val universalTouchListener = View.OnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    startY = event.y
                    startX = event.x
                    startTime = System.currentTimeMillis()
                    isMoving = false
                    holdTriggered = false
                    
                    // Start hold detection for all views (more universal)
                    holdRunnable = Runnable {
                        holdTriggered = true
                        Log.d("StoryViewer", "=== HOLD DETECTED - Starting hold mode ===")
                        startHoldMode()
                    }
                    holdHandler.postDelayed(holdRunnable!!, HOLD_THRESHOLD)
                    Log.d("StoryViewer", "Hold detection started - threshold: ${HOLD_THRESHOLD}ms on ${getViewName(v.id)}")
                    
                    Log.d("StoryViewer", "Touch down on ${getViewName(v.id)}: ($startX, $startY)")
                    true
                }
                
                MotionEvent.ACTION_MOVE -> {
                    val deltaY = kotlin.math.abs(event.y - startY)
                    val deltaX = kotlin.math.abs(event.x - startX)
                    
                    Log.d("StoryViewer", "ACTION_MOVE - deltaX: $deltaX, deltaY: $deltaY, threshold: $MOVEMENT_THRESHOLD")
                    
                    // Only cancel hold if movement is significant AND it's not already triggered
                    if ((deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) && !holdTriggered) {
                        if (!isMoving) {
                            Log.d("StoryViewer", "Large movement detected - cancelling hold and marking as moving")
                            // Cancel hold detection
                            holdRunnable?.let { 
                                holdHandler.removeCallbacks(it) 
                                Log.d("StoryViewer", "Hold cancelled due to movement: deltaX=$deltaX, deltaY=$deltaY")
                            }
                        }
                        isMoving = true
                    }
                    true
                }
                
                MotionEvent.ACTION_UP -> {
                    val deltaY = event.y - startY
                    val deltaX = event.x - startX
                    val duration = System.currentTimeMillis() - startTime
                    
                    Log.d("StoryViewer", "Touch up on ${getViewName(v.id)} - deltaY: $deltaY, deltaX: $deltaX, duration: ${duration}ms, isMoving: $isMoving, holdTriggered: $holdTriggered")
                    
                    // Cancel any pending hold detection
                    holdRunnable?.let { 
                        holdHandler.removeCallbacks(it)
                        Log.d("StoryViewer", "Cancelled pending hold detection")
                    }
                    
                    // If hold was triggered, handle hold release
                    if (holdTriggered || isHolding) {
                        Log.d("StoryViewer", "=== HOLD RELEASED - Ending hold mode ===")
                        if (isHolding) {
                            endHoldMode()
                        }
                        return@OnTouchListener true
                    }
                    
                    // Don't process other gestures if in hold mode
                    if (isHolding) {
                        Log.d("StoryViewer", "Ignoring gesture - in hold mode")
                        return@OnTouchListener true
                    }
                    
                    val absX = kotlin.math.abs(deltaX)
                    val absY = kotlin.math.abs(deltaY)
                    
                    // Check for swipe gestures first (higher priority)
                    if (isMoving && (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD)) {
                        if (absX > absY) {
                            // Horizontal swipe - FIXED DIRECTION LOGIC
                            if (deltaX < -SWIPE_THRESHOLD) {
                                // Swipe LEFT = Next Story/User (slide to left reveals next content)
                                Log.d("StoryViewer", "=== SWIPE LEFT DETECTED ===")
                                handleSwipeLeft() // This should go to NEXT
                                return@OnTouchListener true
                            } else if (deltaX > SWIPE_THRESHOLD) {
                                // Swipe RIGHT = Previous Story/User (slide to right reveals previous content)
                                Log.d("StoryViewer", "=== SWIPE RIGHT DETECTED ===")
                                handleSwipeRight() // This should go to PREVIOUS
                                return@OnTouchListener true
                            }
                        } else {
                            // Vertical swipe - for direct user navigation
                            if (deltaY < -SWIPE_THRESHOLD) {
                                Log.d("StoryViewer", "=== SWIPE UP DETECTED ===")
                                handleSwipeUp() // Next user
                                return@OnTouchListener true
                            } else if (deltaY > SWIPE_THRESHOLD) {
                                Log.d("StoryViewer", "=== SWIPE DOWN DETECTED ===")
                                handleSwipeDown() // Previous user
                                return@OnTouchListener true
                            }
                        }
                    }
                    
                    // Check for tap gestures (only if not moving and quick duration)
                    if (!isMoving && duration < TAP_MAX_DURATION && absX < MOVEMENT_THRESHOLD && absY < MOVEMENT_THRESHOLD) {
                        when (v.id) {
                            R.id.leftTouchArea -> {
                                Log.d("StoryViewer", "=== LEFT TAP DETECTED ===")
                                handleLeftTap()
                                return@OnTouchListener true
                            }
                            R.id.rightTouchArea -> {
                                Log.d("StoryViewer", "=== RIGHT TAP DETECTED ===")
                                handleRightTap()
                                return@OnTouchListener true
                            }
                            R.id.storyImageView -> {
                                Log.d("StoryViewer", "=== STORY IMAGE TAP (ignored) ===")
                                // Story image taps are ignored to prevent accidental navigation
                                return@OnTouchListener true
                            }
                        }
                    }
                    
                    // Fallback: Check for hold based on duration (if automatic detection failed)
                    if (!isMoving && duration >= HOLD_THRESHOLD && absX < MOVEMENT_THRESHOLD && absY < MOVEMENT_THRESHOLD) {
                        Log.d("StoryViewer", "=== MANUAL HOLD DETECTED (fallback) - duration: ${duration}ms ===")
                        startHoldMode()
                        return@OnTouchListener true
                    }
                    
                    Log.d("StoryViewer", "No gesture recognized - duration: ${duration}ms, isMoving: $isMoving, absX: $absX, absY: $absY")
                    false
                }
                
                MotionEvent.ACTION_CANCEL -> {
                    Log.d("StoryViewer", "ACTION_CANCEL - cleaning up hold detection")
                    // Cancel hold detection and end hold mode if active
                    holdRunnable?.let { 
                        holdHandler.removeCallbacks(it)
                        Log.d("StoryViewer", "Cancelled hold detection due to ACTION_CANCEL")
                    }
                    if (isHolding || holdTriggered) {
                        Log.d("StoryViewer", "=== TOUCH CANCELLED - Ending hold mode ===")
                        endHoldMode()
                    }
                    false
                }
                
                else -> false
            }
        }
        
        // Apply the universal touch listener to all interactive areas
        binding.leftTouchArea.setOnTouchListener(universalTouchListener)
        binding.rightTouchArea.setOnTouchListener(universalTouchListener)
        binding.storyImageView.setOnTouchListener(universalTouchListener)
    }
    
    private fun getViewName(viewId: Int): String {
        return when (viewId) {
            R.id.leftTouchArea -> "LeftTouchArea"
            R.id.rightTouchArea -> "RightTouchArea"
            R.id.storyImageView -> "StoryImageView"
            else -> "Unknown"
        }
    }
    
    private fun startHoldMode() {
        if (isActivityDestroyed || isFinishing || isHolding) return
        
        Log.d("StoryViewer", "Starting hold mode - pausing story and hiding UI")
        isHolding = true
        
        // Pause the story
        pauseStory()
        
        // Hide all UI overlays with smooth animation
        binding.userProfileImage.animate()
            .alpha(0f)
            .setDuration(200)
            .start()
            
        binding.userNameText.animate()
            .alpha(0f)
            .setDuration(200)
            .start()
            
        binding.timeAgoText.animate()
            .alpha(0f)
            .setDuration(200)
            .start()
            
        binding.closeButton.animate()
            .alpha(0f)
            .setDuration(200)
            .start()
            
        binding.progressContainer.animate()
            .alpha(0f)
            .setDuration(200)
            .start()
    }
    
    private fun endHoldMode() {
        if (isActivityDestroyed || isFinishing || !isHolding) return
        
        Log.d("StoryViewer", "Ending hold mode - resuming story and showing UI")
        isHolding = false
        
        // Resume the story
        resumeStory()
        
        // Show all UI overlays with smooth animation
        binding.userProfileImage.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
            
        binding.userNameText.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
            
        binding.timeAgoText.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
            
        binding.closeButton.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
            
        binding.progressContainer.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
    }
    
    private fun loadStoriesForUser(storyId: String) {
        Log.d("StoryViewer", "Loading stories for storyId: $storyId")
        storiesListener?.remove() // Remove previous listener
        storiesListener = firebaseRepository.getStoriesRealTime { allStories ->
            Log.d("StoryViewer", "Received ${allStories.size} stories from Firebase")
            
            // Group stories by userId and sort by timestamp
            allStoriesMap = allStories.groupBy { it.userId }
                .mapValues { (_, userStories) -> userStories.sortedBy { it.timestamp } }
            
            // Get list of all users who have stories, sorted by latest story timestamp
            allUsers = allStoriesMap.keys.sortedBy { userId ->
                allStoriesMap[userId]?.maxOfOrNull { it.timestamp } ?: 0L
            }.reversed() // Most recent first
            
            Log.d("StoryViewer", "Found ${allUsers.size} users with stories: $allUsers")
            
            // Find the clicked story and set current user
            val clickedStory = allStories.find { it.id == storyId }
            if (clickedStory != null && !isActivityDestroyed) {
                currentUserId = clickedStory.userId
                currentUserIndex = allUsers.indexOf(currentUserId)
                
                Log.d("StoryViewer", "Found clicked story from user: ${clickedStory.userName}")
                Log.d("StoryViewer", "Current user index: $currentUserIndex/${allUsers.size}")
                
                // Load stories for current user
                stories = allStoriesMap[currentUserId] ?: emptyList()
                currentStoryIndex = stories.indexOfFirst { it.id == storyId }
                if (currentStoryIndex == -1) currentStoryIndex = 0
                
                Log.d("StoryViewer", "Found ${stories.size} stories from same user:")
                stories.forEachIndexed { index, story ->
                    Log.d("StoryViewer", "  [$index] Story: ${story.id}")
                }
                Log.d("StoryViewer", "Current story index: $currentStoryIndex")
                
                if (!isActivityDestroyed && !isFinishing) {
                    runOnUiThread {
                        if (!isActivityDestroyed && !isFinishing) {
                            setupProgressIndicators()
                            displayCurrentStory()
                        }
                    }
                }
            } else {
                Log.e("StoryViewer", "Story not found with id: $storyId or activity destroyed")
            }
        }
    }
    
    private fun setupProgressIndicators() {
        binding.progressContainer.removeAllViews()
        
        for (i in stories.indices) {
            val progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
                layoutParams = android.widget.LinearLayout.LayoutParams(
                    0,
                    android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                    1f
                ).apply {
                    marginEnd = if (i < stories.size - 1) 8 else 0
                }
                max = 100
                progress = if (i < currentStoryIndex) 100 else 0
                progressDrawable = resources.getDrawable(android.R.drawable.progress_horizontal, theme)
                progressDrawable.setTint(resources.getColor(android.R.color.white, theme))
            }
            binding.progressContainer.addView(progressBar)
        }
    }
    
    private fun displayCurrentStory() {
        if (currentStoryIndex >= stories.size || isActivityDestroyed || isFinishing) {
            Log.d("StoryViewer", "Cannot display story - index: $currentStoryIndex, stories: ${stories.size}, destroyed: $isActivityDestroyed, finishing: $isFinishing")
            finish()
            return
        }
        
        val story = stories[currentStoryIndex]
        Log.d("StoryViewer", "Displaying story: ${story.id} from ${story.userName}")
        
        try {
            // Smart image loading logic untuk support URL, base64, dan placeholder
            if (!isActivityDestroyed && !isFinishing) {
                val imageToLoad = when {
                    // Prioritas 1: Jika imageUrl berisi URL link, gunakan itu
                    story.imageUrl.isNotEmpty() && (story.imageUrl.startsWith("http://") || story.imageUrl.startsWith("https://")) -> {
                        story.imageUrl
                    }
                    // Prioritas 2: Jika mainImageUrl ada (biasanya base64 data URI)
                    story.mainImageUrl.isNotEmpty() -> {
                        story.mainImageUrl
                    }
                    // Prioritas 3: Jika storyImageUrl ada (fallback)
                    story.storyImageUrl.isNotEmpty() -> {
                        story.storyImageUrl
                    }
                    // Fallback: null untuk placeholder
                    else -> null
                }

                if (imageToLoad != null && imageToLoad.startsWith("data:image")) {
                    // Base64 data URI - decode to bitmap
                    val bitmap = imageToLoad.base64ToBitmap()
                    if (bitmap != null) {
                        binding.storyImageView.setImageBitmap(bitmap)
                    }
                } else {
                    // Regular URL atau null (akan show placeholder)
                    Glide.with(this)
                        .load(imageToLoad)
                        .placeholder(R.drawable.ic_launcher_foreground)
                        .error(R.drawable.ic_launcher_foreground)
                        .into(binding.storyImageView)
                }
                    
                // Load user profile
                Glide.with(this)
                    .load(story.userProfileImage)
                    .circleCrop()
                    .into(binding.userProfileImage)
            }
        } catch (e: IllegalArgumentException) {
            Log.e("StoryViewer", "Error loading images: ${e.message}")
            finish()
            return
        }
        
        binding.userNameText.text = story.userName
        binding.timeAgoText.text = getTimeAgo(story.timestamp)
        
        // Text is now burned into the image, so no separate overlay needed
        binding.storyTextOverlay.visibility = View.GONE
        
        // Update delete button visibility based on story ownership
        updateDeleteButtonVisibility()
        
        // Mark as viewed
        firebaseRepository.markStoryAsViewed(story.id, currentUserId)
        
        startProgressAnimation()
    }
    
    private fun startProgressAnimation() {
        if (isPaused) return // Don't start if paused
        
        stopProgressAnimation()
        
        val progressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        progressBar?.let { bar ->
            progressAnimator = ObjectAnimator.ofInt(bar, "progress", 0, 100).apply {
                duration = STORY_DURATION
                start()
            }
            
            progressRunnable = Runnable {
                goToNextStory() // Use new navigation logic
            }
            handler.postDelayed(progressRunnable!!, STORY_DURATION)
        }
    }
    
    private fun stopProgressAnimation() {
        progressAnimator?.cancel()
        progressRunnable?.let { handler.removeCallbacks(it) }
    }
    
    // ============================================================================
    // NAVIGATION LOGIC - Instagram Style
    // ============================================================================
    
    private fun handleLeftTap() {
        Log.d("StoryViewer", "=== handleLeftTap() called ===")
        Log.d("StoryViewer", "Left tap - Current: $currentStoryIndex, Total: ${stories.size}, User: $currentUserIndex/${allUsers.size}")
        
        // Always try to go to previous story (will handle cross-user navigation automatically)
        goToPreviousStory()
    }
    
    private fun handleRightTap() {
        Log.d("StoryViewer", "=== handleRightTap() called ===")
        Log.d("StoryViewer", "Right tap - Current: $currentStoryIndex, Total: ${stories.size}, User: $currentUserIndex/${allUsers.size}")
        
        // Always try to go to next story (will handle cross-user navigation automatically)
        goToNextStory()
    }
    
    private fun handleSwipeUp() {
        Log.d("StoryViewer", "=== handleSwipeUp() called ===")
        Log.d("StoryViewer", "Swipe up - Current user: $currentUserIndex/${allUsers.size}")
        
        // Add visual feedback
        runOnUiThread {
            // You could add a subtle animation here
            Log.d("StoryViewer", "Processing swipe up to next user")
        }
        
        // Skip to next user directly, regardless of current story position
        goToNextUser()
    }
    
    private fun handleSwipeDown() {
        Log.d("StoryViewer", "=== handleSwipeDown() called ===")
        Log.d("StoryViewer", "Swipe down - Current user: $currentUserIndex/${allUsers.size}")
        
        // Add visual feedback
        runOnUiThread {
            // You could add a subtle animation here
            Log.d("StoryViewer", "Processing swipe down to previous user")
        }
        
        // Skip to previous user directly, regardless of current story position  
        goToPreviousUser()
    }
    
    private fun handleSwipeLeft() {
        Log.d("StoryViewer", "=== handleSwipeLeft() called ===")
        Log.d("StoryViewer", "Swipe left - going directly to NEXT USER")
        
        // Swipe left = go directly to NEXT USER (skip current user's remaining stories)
        goToNextUser()
    }
    
    private fun handleSwipeRight() {
        Log.d("StoryViewer", "=== handleSwipeRight() called ===")
        Log.d("StoryViewer", "Swipe right - going directly to PREVIOUS USER")
        
        // Swipe right = go directly to PREVIOUS USER (skip to previous user's first story)
        goToPreviousUser()
    }
    
    // New helper functions for within-user navigation
    private fun goToNextStoryInCurrentUser() {
        if (isActivityDestroyed || isFinishing) return
        if (currentStoryIndex >= stories.size - 1) return
        
        stopProgressAnimation()
        
        // Mark current progress as complete
        val currentProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        currentProgressBar?.progress = 100
        
        currentStoryIndex++
        Log.d("StoryViewer", "Moving to next story in same user: $currentStoryIndex")
        displayCurrentStory()
    }
    
    private fun goToPreviousStoryInCurrentUser() {
        if (isActivityDestroyed || isFinishing) return
        if (currentStoryIndex <= 0) return
        
        stopProgressAnimation()
        
        // Reset current progress
        val currentProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        currentProgressBar?.progress = 0
        
        currentStoryIndex--
        
        // Reset previous progress  
        val previousProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        previousProgressBar?.progress = 0
        
        Log.d("StoryViewer", "Moving to previous story in same user: $currentStoryIndex")
        displayCurrentStory()
    }
    
    private fun goToPreviousStory() {
        if (isActivityDestroyed || isFinishing) return
        
        stopProgressAnimation()
        
        Log.d("StoryViewer", "goToPreviousStory - Current index: $currentStoryIndex, Total stories: ${stories.size}")
        
        if (currentStoryIndex > 0) {
            // Reset current progress
            val currentProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
            currentProgressBar?.progress = 0
            
            currentStoryIndex--
            
            // Reset previous progress  
            val previousProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
            previousProgressBar?.progress = 0
            
            Log.d("StoryViewer", "Going to previous story at index: $currentStoryIndex")
            displayCurrentStory()
        } else {
            // First story of current user - go to previous user's last story
            Log.d("StoryViewer", "At first story of current user, going to previous user")
            goToPreviousUser()
        }
    }
    
    private fun goToPreviousUser() {
        currentUserIndex--
        Log.d("StoryViewer", "goToPreviousUser - New user index: $currentUserIndex, Total users: ${allUsers.size}")
        
        if (currentUserIndex < 0) {
            // No previous users - exit
            Log.d("StoryViewer", "No previous users, exiting")
            handleExit("first_story_of_first_user")
        } else {
            // Load stories from previous user
            val previousUserId = allUsers[currentUserIndex]
            currentUserId = previousUserId
            stories = allStoriesMap[previousUserId] ?: emptyList()
            currentStoryIndex = 0 // Start from FIRST story of previous user (not last)
            
            Log.d("StoryViewer", "Loading stories from previous user: $previousUserId")
            Log.d("StoryViewer", "Previous user has ${stories.size} stories, going to index: $currentStoryIndex")
            
            if (stories.isNotEmpty() && !isActivityDestroyed && !isFinishing) {
                runOnUiThread {
                    if (!isActivityDestroyed && !isFinishing) {
                        setupProgressIndicators()
                        // Reset all progress bars to 0 since we start from first story
                        for (i in 0 until stories.size) {
                            val progressBar = binding.progressContainer.getChildAt(i) as? ProgressBar
                            progressBar?.progress = 0
                        }
                        displayCurrentStory()
                    }
                }
            } else {
                Log.d("StoryViewer", "Previous user has no stories, trying previous user")
                goToPreviousUser() // Recursively try previous user
            }
        }
    }
    
    private fun goToNextStory() {
        if (isActivityDestroyed || isFinishing || isHolding) return
        
        stopProgressAnimation()
        
        // Mark current progress as complete
        val currentProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        currentProgressBar?.progress = 100
        
        currentStoryIndex++
        Log.d("StoryViewer", "goToNextStory - New index: $currentStoryIndex, Total stories: ${stories.size}")
        
        if (currentStoryIndex >= stories.size) {
            // Reached end of current user's stories
            Log.d("StoryViewer", "Reached end of current user's stories")
            goToNextUser()
        } else {
            // Still have more stories from current user - display next one
            Log.d("StoryViewer", "Displaying next story at index: $currentStoryIndex")
            displayCurrentStory()
        }
    }
    
    private fun goToNextUser() {
        currentUserIndex++
        Log.d("StoryViewer", "goToNextUser - New user index: $currentUserIndex, Total users: ${allUsers.size}")
        
        if (currentUserIndex >= allUsers.size) {
            // No more users with stories - exit
            Log.d("StoryViewer", "No more users with stories, exiting")
            handleExit("end_of_all_stories")
        } else {
            // Load stories from next user
            val nextUserId = allUsers[currentUserIndex]
            currentUserId = nextUserId
            stories = allStoriesMap[nextUserId] ?: emptyList()
            currentStoryIndex = 0
            
            Log.d("StoryViewer", "Loading stories from next user: $nextUserId")
            Log.d("StoryViewer", "Next user has ${stories.size} stories")
            
            if (stories.isNotEmpty() && !isActivityDestroyed && !isFinishing) {
                runOnUiThread {
                    if (!isActivityDestroyed && !isFinishing) {
                        setupProgressIndicators()
                        displayCurrentStory()
                    }
                }
            } else {
                Log.d("StoryViewer", "Next user has no stories, trying next user")
                goToNextUser() // Recursively try next user
            }
        }
    }
    
    private fun handleExit(reason: String) {
        Log.d("StoryViewer", "Exiting story viewer - Reason: $reason")
        finish()
    }
    
    // ============================================================================
    // PAUSE/RESUME LOGIC - Instagram Style  
    // ============================================================================
    
    // ============================================================================
    // PAUSE/RESUME LOGIC - Instagram Style  
    // ============================================================================
    
    private fun pauseStory() {
        if (isPaused || isActivityDestroyed || isFinishing) return
        
        Log.d("StoryViewer", "Pausing story")
        isPaused = true
        
        // Save current progress
        val currentProgressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        pausedProgress = currentProgressBar?.progress ?: 0
        
        // Stop animations
        stopProgressAnimation()
        
        // Optional: Show pause indicator
        // binding.pauseIndicator.visibility = View.VISIBLE
    }
    
    private fun resumeStory() {
        if (!isPaused || isActivityDestroyed || isFinishing) return
        
        Log.d("StoryViewer", "Resuming story from progress: $pausedProgress")
        isPaused = false
        
        // Hide pause indicator
        // binding.pauseIndicator.visibility = View.GONE
        
        // Resume from paused progress
        startProgressAnimationFromProgress(pausedProgress)
    }
    
    private fun startProgressAnimationFromProgress(startProgress: Int) {
        stopProgressAnimation()
        
        val progressBar = binding.progressContainer.getChildAt(currentStoryIndex) as? ProgressBar
        progressBar?.let { bar ->
            val remainingDuration = ((100 - startProgress) * STORY_DURATION / 100).toLong()
            
            progressAnimator = ObjectAnimator.ofInt(bar, "progress", startProgress, 100).apply {
                duration = remainingDuration
                start()
            }
            
            progressRunnable = Runnable {
                goToNextStory()
            }
            handler.postDelayed(progressRunnable!!, remainingDuration)
        }
    }
    
    // ============================================================================
    // DEPRECATED METHODS - Replaced with new navigation logic
    // ============================================================================
    
    // ============================================================================
    // DEPRECATED METHODS - Replaced with new navigation logic
    // ============================================================================
    
    private fun nextStory() {
        // Deprecated - use handleRightTap() instead
        goToNextStory()
    }
    
    private fun previousStory() {
        // Deprecated - use handleLeftTap() instead  
        goToPreviousStory()
    }
    
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    
    private fun getTimeAgo(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        
        return when {
            diff < 60000 -> "now"
            diff < 3600000 -> "${diff / 60000}m"
            diff < 86400000 -> "${diff / 3600000}h"
            else -> "${diff / 86400000}d"
        }
    }
    
    override fun onPause() {
        super.onPause()
        Log.d("StoryViewer", "onPause called")
        stopProgressAnimation()
    }
    
    override fun onResume() {
        super.onResume()
        Log.d("StoryViewer", "onResume called")
        if (stories.isNotEmpty() && !isActivityDestroyed) {
            startProgressAnimation()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d("StoryViewer", "onDestroy called")
        isActivityDestroyed = true
        stopProgressAnimation()
        storiesListener?.remove()
    }
    
    override fun finish() {
        Log.d("StoryViewer", "finish called")
        isActivityDestroyed = true
        stopProgressAnimation()
        storiesListener?.remove()
        super.finish()
    }
}
