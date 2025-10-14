package com.komputerkit.socialmediaapp.activity

// Future Implementation: Swipe Gesture Handler for Story Viewer
// This will be integrated into StoryViewerActivity later

import android.content.Context
import android.view.GestureDetector
import android.view.MotionEvent
import kotlin.math.abs

class StorySwipeGestureListener(
    context: Context,
    private val onSwipeLeft: () -> Unit,
    private val onSwipeRight: () -> Unit,
    private val onSwipeUp: () -> Unit,
    private val onSwipeDown: () -> Unit
) : GestureDetector.SimpleOnGestureListener() {

    companion object {
        private const val SWIPE_THRESHOLD = 100
        private const val SWIPE_VELOCITY_THRESHOLD = 100
    }

    override fun onFling(
        e1: MotionEvent?,
        e2: MotionEvent,
        velocityX: Float,
        velocityY: Float
    ): Boolean {
        if (e1 == null) return false
        
        val diffX = e2.x - e1.x
        val diffY = e2.y - e1.y
        
        return if (abs(diffX) > abs(diffY)) {
            // Horizontal swipe
            if (abs(diffX) > SWIPE_THRESHOLD && abs(velocityX) > SWIPE_VELOCITY_THRESHOLD) {
                if (diffX > 0) {
                    onSwipeRight()
                } else {
                    onSwipeLeft()
                }
                true
            } else {
                false
            }
        } else {
            // Vertical swipe
            if (abs(diffY) > SWIPE_THRESHOLD && abs(velocityY) > SWIPE_VELOCITY_THRESHOLD) {
                if (diffY > 0) {
                    onSwipeDown()
                } else {
                    onSwipeUp()
                }
                true
            } else {
                false
            }
        }
    }
}

/*
USAGE IN STORY VIEWER:

private fun setupSwipeGestures() {
    val gestureListener = StorySwipeGestureListener(
        context = this,
        onSwipeLeft = { handleSwipeLeft() },
        onSwipeRight = { handleSwipeRight() },
        onSwipeUp = { handleSwipeUp() },
        onSwipeDown = { handleSwipeDown() }
    )
    
    val gestureDetector = GestureDetector(this, gestureListener)
    
    binding.storyImageView.setOnTouchListener { _, event ->
        gestureDetector.onTouchEvent(event)
    }
}

private fun handleSwipeLeft() {
    // Skip to next user's stories
    Log.d("StoryViewer", "Swipe left - Next user stories")
    // TODO: Implement cross-user navigation
}

private fun handleSwipeRight() {
    // Go back to previous user's stories  
    Log.d("StoryViewer", "Swipe right - Previous user stories")
    // TODO: Implement cross-user navigation
}

private fun handleSwipeUp() {
    // Share story or show story info
    Log.d("StoryViewer", "Swipe up - Story actions")
}

private fun handleSwipeDown() {
    // Close story viewer
    Log.d("StoryViewer", "Swipe down - Close story")
    handleExit("swipe_down")
}
*/
