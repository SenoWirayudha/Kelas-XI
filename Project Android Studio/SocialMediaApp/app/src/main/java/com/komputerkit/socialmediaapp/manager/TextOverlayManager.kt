package com.komputerkit.socialmediaapp.manager

import android.content.Context
import android.graphics.Matrix
import android.graphics.RectF
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.komputerkit.socialmediaapp.view.MovableTextView

interface ImageCoordinateProvider {
    fun getImageMatrix(): Matrix
    fun getImageBounds(): RectF
}

interface CropModeProvider {
    fun isCropModeActive(): Boolean
}

class TextOverlayManager(
    private val context: Context,
    private val container: ViewGroup
) {
    
    private val textViews = mutableListOf<MovableTextView>()
    private var currentSelectedTextView: MovableTextView? = null
    private var onTextViewSelectedListener: ((MovableTextView?) -> Unit)? = null
    private var onTextViewPositionChangedListener: ((MovableTextView) -> Unit)? = null
    private var coordinateProvider: ImageCoordinateProvider? = null
    private var cropModeProvider: CropModeProvider? = null
    
    init {
        // Set coordinate provider if context implements the interface
        if (context is ImageCoordinateProvider) {
            coordinateProvider = context
        }
        
        // Set crop mode provider if context implements the interface
        if (context is CropModeProvider) {
            cropModeProvider = context
        }
        
        // Setup touch listener for container to handle taps on empty areas
        setupContainerTouchListener()
    }
    
    private fun setupContainerTouchListener() {
        container.setOnTouchListener { view, event ->
            // If crop mode is active, don't consume events - let crop view handle them
            val isCropActive = cropModeProvider?.isCropModeActive() ?: false
            if (isCropActive) {
                Log.d("TextOverlayManager", "Crop mode active - not consuming touch events")
                return@setOnTouchListener false // Don't consume, let crop view handle
            }
            
            if (event.action == MotionEvent.ACTION_DOWN) {
                // Check if touch is on empty area (not on any text view)
                val touchedChild = findChildViewUnder(event.x, event.y)
                if (touchedChild == null) {
                    Log.d("TextOverlayManager", "Touch on empty area - dismissing keyboard")
                    dismissKeyboardAndExitEditMode()
                    return@setOnTouchListener true // Consume event for keyboard dismiss
                }
            }
            false // Let child views handle their own touches
        }
    }
    
    private fun findChildViewUnder(x: Float, y: Float): View? {
        for (i in 0 until container.childCount) {
            val child = container.getChildAt(i)
            if (child is MovableTextView) {
                val left = child.x
                val top = child.y
                val right = left + child.width
                val bottom = top + child.height
                
                if (x >= left && x <= right && y >= top && y <= bottom) {
                    return child
                }
            }
        }
        return null
    }
    
    private fun dismissKeyboardAndExitEditMode() {
        // Exit edit mode for all text views
        textViews.forEach { textView ->
            textView.exitEditMode()
        }
        
        // Clear focus from container
        container.clearFocus()
        
        Log.d("TextOverlayManager", "Keyboard dismissed and edit mode exited")
    }
    
    fun setOnTextViewSelectedListener(listener: (MovableTextView?) -> Unit) {
        onTextViewSelectedListener = listener
    }
    
    fun setOnTextViewPositionChangedListener(listener: (MovableTextView) -> Unit) {
        onTextViewPositionChangedListener = listener
    }
    
    fun addTextView(text: String = "Text"): MovableTextView {
        val textView = MovableTextView(context).apply {
            setText(text)
            setTextSizeInPx(48f)
            textColorValue = android.graphics.Color.WHITE
            strokeColorValue = android.graphics.Color.BLACK
            strokeWidthValue = 4f
            fontType = MovableTextView.FontType.NORMAL
            
            // Set up selection callback
            onTextViewSelectedListener = { selectedTextView ->
                Log.d("TextOverlayManager", "Text view selected via callback - ID: ${selectedTextView.textViewId}")
                setSelectedTextView(selectedTextView)
            }
            
            // Set up position change callback for saving to bitmap
            onPositionChangedListener = { textView ->
                Log.d("TextOverlayManager", "Text view position changed - ID: ${textView.textViewId}")
                // This will be handled by StoryEditorActivity to save to bitmap
                onTextViewPositionChangedListener?.invoke(textView)
            }
            
            // Set up crop mode provider
            cropModeProvider = {
                this@TextOverlayManager.cropModeProvider?.isCropModeActive() ?: false
            }
            
            // Set up position tracking for layered canvas
            setOnTouchListener { view, motionEvent ->
                // Track position changes for relative positioning
                if (motionEvent.action == android.view.MotionEvent.ACTION_UP) {
                    val imageBounds = coordinateProvider?.getImageBounds()
                    if (imageBounds != null && !imageBounds.isEmpty) {
                        // Calculate relative position within image bounds, not container bounds
                        val relativeX = (view.x - imageBounds.left) / imageBounds.width()
                        val relativeY = (view.y - imageBounds.top) / imageBounds.height()
                        
                        Log.d("TextOverlayManager", "Text position within image: ${textViewId} -> ($relativeX, $relativeY)")
                        Log.d("TextOverlayManager", "Image bounds: $imageBounds")
                    } else {
                        // Fallback to container-based positioning
                        val relativeX = view.x / container.width.toFloat()
                        val relativeY = view.y / container.height.toFloat()
                        
                        Log.d("TextOverlayManager", "Text position (fallback): ${textViewId} -> ($relativeX, $relativeY)")
                    }
                }
                false
            }
        }
        
        val layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        )
        
        textView.layoutParams = layoutParams
        container.addView(textView)
        textViews.add(textView)
        
        // Position text in center of image bounds after view is added
        textView.post {
            positionTextViewInImageCenter(textView)
        }
        
        Log.d("TextOverlayManager", "Added new text view - ID: ${textView.textViewId}, total count: ${textViews.size}")
        
        // Set as selected
        setSelectedTextView(textView)
        
        return textView
    }
    
    private fun positionTextViewInImageCenter(textView: MovableTextView) {
        val imageBounds = coordinateProvider?.getImageBounds()
        if (imageBounds != null && !imageBounds.isEmpty) {
            // Position in center of image bounds
            val centerX = imageBounds.centerX() - (textView.width / 2f)
            val centerY = imageBounds.centerY() - (textView.height / 2f)
            
            textView.x = centerX
            textView.y = centerY
            
            Log.d("TextOverlayManager", "Positioned text view at image center: ($centerX, $centerY)")
            Log.d("TextOverlayManager", "Image bounds: $imageBounds")
        } else {
            // Fallback to container center
            val centerX = (container.width / 2f) - (textView.width / 2f)
            val centerY = (container.height / 2f) - (textView.height / 2f)
            
            textView.x = centerX
            textView.y = centerY
            
            Log.d("TextOverlayManager", "Positioned text view at container center (fallback): ($centerX, $centerY)")
        }
    }
    
    fun getAllTextViews(): List<MovableTextView> {
        return textViews.toList()
    }
    
    fun setSelectedTextView(textView: MovableTextView?) {
        // Deselect current
        currentSelectedTextView?.let { currentTextView ->
            Log.d("TextOverlayManager", "Deselecting text view - ID: ${currentTextView.textViewId}")
            currentTextView.isSelected = false
            currentTextView.background = null
        }
        
        // Select new
        currentSelectedTextView = textView
        textView?.let { newTextView ->
            Log.d("TextOverlayManager", "Selecting text view - ID: ${newTextView.textViewId}")
            newTextView.isSelected = true
            newTextView.setBackgroundResource(com.komputerkit.socialmediaapp.R.drawable.text_border_selected)
        }
        
        Log.d("TextOverlayManager", "Selection changed. Current selected ID: ${currentSelectedTextView?.textViewId}")
        onTextViewSelectedListener?.invoke(textView)
    }
    
    fun getCurrentSelectedTextView(): MovableTextView? {
        return currentSelectedTextView
    }
    
    fun removeTextView(textView: MovableTextView) {
        Log.d("TextOverlayManager", "Removing text view - ID: ${textView.textViewId}")
        
        container.removeView(textView)
        textViews.remove(textView)
        
        if (currentSelectedTextView == textView) {
            Log.d("TextOverlayManager", "Removed text view was selected, clearing selection")
            currentSelectedTextView = null
            onTextViewSelectedListener?.invoke(null)
        }
        
        Log.d("TextOverlayManager", "Text view removed. Remaining count: ${textViews.size}")
    }
    
    fun clearAllText() {
        textViews.forEach { textView ->
            container.removeView(textView)
        }
        textViews.clear()
        currentSelectedTextView = null
        onTextViewSelectedListener?.invoke(null)
    }
    
    fun forceDelete() {
        currentSelectedTextView?.let { textView ->
            removeTextView(textView)
        }
    }
    
    fun setTextSizeInPx(size: Float) {
        currentSelectedTextView?.setTextSizeInPx(size)
    }
    
    fun getTextSizeInPx(): Float {
        return currentSelectedTextView?.textSize ?: 48f
    }
    
    fun getCurrentFontType(): MovableTextView.FontType {
        return currentSelectedTextView?.fontType ?: MovableTextView.FontType.NORMAL
    }
    
    fun setFontType(fontType: MovableTextView.FontType) {
        Log.d("TextOverlayManager", "=== FONT TYPE CHANGE START ===")
        Log.d("TextOverlayManager", "Requested font type: $fontType")
        Log.d("TextOverlayManager", "Current selected text view ID: ${currentSelectedTextView?.textViewId}")
        Log.d("TextOverlayManager", "Total text views: ${textViews.size}")
        
        currentSelectedTextView?.let { textView ->
            Log.d("TextOverlayManager", "Applying font type $fontType to text view ID: ${textView.textViewId}")
            Log.d("TextOverlayManager", "Text content: '${textView.text}'")
            
            // Set the font type
            textView.fontType = fontType
            textView.invalidate()
            textView.requestLayout()
            
            Log.d("TextOverlayManager", "Font type applied successfully")
        } ?: run {
            Log.w("TextOverlayManager", "No text view selected! Cannot apply font type.")
        }
        
        Log.d("TextOverlayManager", "=== FONT TYPE CHANGE END ===")
    }
    
    fun hasUserContent(): Boolean {
        return textViews.any { it.text.toString().trim().isNotEmpty() }
    }
    
    // Debug function to get all text view IDs
    fun getAllTextViewIds(): List<String> {
        return textViews.map { it.textViewId }
    }
    
    // Debug function to find text view by ID
    fun getTextViewById(id: String): MovableTextView? {
        return textViews.find { it.textViewId == id }
    }
    
    // Public method to exit edit mode for all text views
    fun exitAllEditModes() {
        dismissKeyboardAndExitEditMode()
    }
    
    // Check if any text view is currently in edit mode
    fun isAnyTextViewInEditMode(): Boolean {
        return textViews.any { it.hasFocus() }
    }
}

// Extension function to set text size in pixels
fun MovableTextView.setTextSizeInPx(sizeInPx: Float) {
    setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, sizeInPx)
}
