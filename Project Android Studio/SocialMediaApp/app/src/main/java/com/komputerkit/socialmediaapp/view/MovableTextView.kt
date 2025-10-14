package com.komputerkit.socialmediaapp.view

import android.content.Context
import android.graphics.*
import android.text.InputType
import android.text.TextPaint
import android.util.AttributeSet
import android.util.Log
import android.util.TypedValue
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import com.komputerkit.socialmediaapp.R
import kotlin.math.*
import java.util.*

class MovableTextView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : EditText(context, attrs, defStyleAttr) {

    enum class FontType {
        NORMAL, BOLD, ITALIC, SERIF, MONOSPACE, CASUAL, CURSIVE
    }

    // Unique ID for each text view instance
    val textViewId: String = UUID.randomUUID().toString()
    
    // Selection state management
    var onTextViewSelectedListener: ((MovableTextView) -> Unit)? = null
    var onPositionChangedListener: ((MovableTextView) -> Unit)? = null
    var cropModeProvider: (() -> Boolean)? = null

    // Gesture and drag properties
    private val gestureDetector: GestureDetector
    private var isSelected = false
    private var isDragging = false
    private var isInEditMode = false
    private var startX = 0f
    private var startY = 0f
    private var initialX = 0f
    private var initialY = 0f
    private val touchSlop = 20f // Threshold for drag detection

    // Style properties
    var fontType: FontType = FontType.NORMAL
        set(value) {
            Log.d("MovableTextView", "Font type changed from $field to $value for text view ID: $textViewId")
            Log.d("MovableTextView", "Text content: '${text}'")
            field = value
            updateTextStyle()
        }

    var textColorValue: Int = Color.WHITE
        set(value) {
            field = value
            setTextColor(value)
        }

    var strokeColorValue: Int = Color.BLACK
        set(value) {
            field = value
            invalidate()
        }

    var strokeWidthValue: Float = 4f
        set(value) {
            field = value
            invalidate()
        }

    // Image relative positioning properties
    private var imageWidth: Int = 0
    private var imageHeight: Int = 0
    private var imageLeft: Float = 0f
    private var imageTop: Float = 0f

    init {
        background = null
        setTextColor(textColorValue)
        gravity = Gravity.CENTER
        isCursorVisible = true
        inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE
        setSelectAllOnFocus(true)
        isClickable = true
        isFocusable = true
        isFocusableInTouchMode = true
        
        gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
            override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
                Log.d("MovableTextView", "Single tap confirmed - ID: $textViewId, isInEditMode: $isInEditMode")
                
                // If not in edit mode, enter edit mode
                if (!isInEditMode) {
                    Log.d("MovableTextView", "Entering edit mode via gesture - ID: $textViewId")
                    
                    // Notify that this text view is selected
                    onTextViewSelectedListener?.invoke(this@MovableTextView)
                    
                    // Use helper method to enter edit mode
                    enterEditMode(e.x, e.y)
                    
                    return true
                } else {
                    Log.d("MovableTextView", "Already in edit mode, positioning cursor")
                    
                    // Already in edit mode, just position cursor
                    val layout = layout
                    if (layout != null) {
                        val line = layout.getLineForVertical(e.y.toInt())
                        val offset = layout.getOffsetForHorizontal(line, e.x)
                        setSelection(offset)
                        Log.d("MovableTextView", "Cursor repositioned to: $offset")
                    }
                }
                return false
            }
            
            override fun onDoubleTap(e: MotionEvent): Boolean {
                Log.d("MovableTextView", "Double tap detected - selecting all text - ID: $textViewId")
                
                // If not in edit mode, enter edit mode first
                if (!isInEditMode) {
                    onTextViewSelectedListener?.invoke(this@MovableTextView)
                    enterEditMode() // Use helper method
                }
                
                // Select all text
                selectAll()
                Log.d("MovableTextView", "All text selected")
                return true
            }
        })

        updateTextStyle()
        updateBorder()
    }
    
    // Helper method to enter edit mode reliably
    fun enterEditMode(tapX: Float? = null, tapY: Float? = null) {
        Log.d("MovableTextView", "Entering edit mode programmatically - ID: $textViewId")
        
        // Set edit mode state
        isInEditMode = true
        isCursorVisible = true
        
        // Request focus
        requestFocus()
        
        // Show keyboard with multiple attempts to ensure it shows
        post {
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            
            // Clear any existing input connection
            clearComposingText()
            
            // Force show keyboard
            val shown = imm.showSoftInput(this, InputMethodManager.SHOW_FORCED)
            Log.d("MovableTextView", "Keyboard show attempt 1 result: $shown")
            
            // Backup attempt if first fails
            if (!shown) {
                postDelayed({
                    val shown2 = imm.showSoftInput(this, InputMethodManager.SHOW_IMPLICIT)
                    Log.d("MovableTextView", "Keyboard show attempt 2 result: $shown2")
                }, 100)
            }
        }
        
        // Set cursor position if tap coordinates provided
        if (tapX != null && tapY != null) {
            val layout = layout
            if (layout != null) {
                val line = layout.getLineForVertical(tapY.toInt())
                val offset = layout.getOffsetForHorizontal(line, tapX)
                setSelection(offset)
                Log.d("MovableTextView", "Cursor set to position: $offset based on tap")
            }
        } else {
            // Move cursor to end if no specific position
            setSelection(text.length)
        }
        
        // Update border to show selected state
        updateBorder()
    }
    
    override fun onFocusChanged(focused: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
        super.onFocusChanged(focused, direction, previouslyFocusedRect)
        
        if (focused) {
            Log.d("MovableTextView", "Text view focused - ID: $textViewId")
            
            // Notify that this text view is selected
            onTextViewSelectedListener?.invoke(this)
            
            isInEditMode = true
            isCursorVisible = true
            post {
                val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.showSoftInput(this, InputMethodManager.SHOW_IMPLICIT)
            }
        } else {
            isInEditMode = false
            isCursorVisible = false
        }
        updateBorder()
    }

    private fun updateTextStyle() {
        // Create proper fonts for each type
        val typeface = when (fontType) {
            FontType.NORMAL -> Typeface.DEFAULT
            FontType.BOLD -> Typeface.DEFAULT_BOLD  
            FontType.ITALIC -> Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
            FontType.SERIF -> Typeface.SERIF
            FontType.MONOSPACE -> Typeface.MONOSPACE
            FontType.CASUAL -> {
                // Use Android's built-in casual/fantasy font
                try {
                    Typeface.create("casual", Typeface.BOLD)
                } catch (e: Exception) {
                    // Fallback to sans-serif bold if casual not available
                    Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
                }
            }
            FontType.CURSIVE -> {
                // Use Android's built-in cursive font family
                try {
                    Typeface.create("cursive", Typeface.NORMAL)
                } catch (e: Exception) {
                    // Fallback to serif italic if cursive not available
                    Typeface.create(Typeface.SERIF, Typeface.ITALIC)
                }
            }
        }
        
        // Apply typeface
        setTypeface(typeface)
        
        // Reset all effects first
        setShadowLayer(0f, 0f, 0f, Color.TRANSPARENT)
        scaleX = 1.0f
        rotation = 0f
        
        // Apply specific styling for each font
        when (fontType) {
            FontType.CURSIVE -> {
                // Make cursive very distinctive
                setShadowLayer(4f, 2f, 2f, Color.BLACK)
                scaleX = 1.3f // Much wider for cursive look
                rotation = -2f // Slight tilt for cursive effect
            }
            FontType.CASUAL -> {
                // Make casual fun and bouncy
                setShadowLayer(3f, 1f, 1f, Color.BLUE)
                scaleX = 0.9f // Slightly narrower
                rotation = 1f // Slight positive tilt for casual fun look
            }
            else -> {
                // Keep others normal - no effects
            }
        }
        
        invalidate()
        requestLayout()
        
        Log.d("MovableTextView", "Font updated for ID: $textViewId, fontType: $fontType, typeface: $typeface")
    }

    private fun updateBorder() {
        if (isSelected) {
            setBackgroundResource(R.drawable.text_border_selected)
        } else {
            background = null
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        // Check if crop mode is active - if so, don't handle touch events
        val isCropActive = cropModeProvider?.invoke() ?: false
        if (isCropActive) {
            Log.d("MovableTextView", "Crop mode active - not handling touch events")
            return false // Let crop view handle the touch
        }
        
        Log.d("MovableTextView", "onTouchEvent: ${event.actionToString()}, isDragging: $isDragging, isInEditMode: $isInEditMode")
        
        // First, always let gesture detector handle the event for tap detection
        val gestureHandled = gestureDetector.onTouchEvent(event)
        
        // If gesture detector handled it (tap/double tap), return true
        if (gestureHandled) {
            Log.d("MovableTextView", "Gesture detector handled event: ${event.actionToString()}")
            return true
        }
        
        // Handle drag logic
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                Log.d("MovableTextView", "ACTION_DOWN on text view ID: $textViewId")
                
                // Always notify selection
                onTextViewSelectedListener?.invoke(this)
                
                // Store initial touch position for drag detection
                startX = event.rawX
                startY = event.rawY
                initialX = x
                initialY = y
                isDragging = false
                
                // If already in edit mode and focused, let EditText handle for cursor positioning
                if (isInEditMode && hasFocus()) {
                    Log.d("MovableTextView", "In edit mode with focus, delegating to EditText")
                    return super.onTouchEvent(event)
                }
                
                return true
            }
            
            MotionEvent.ACTION_MOVE -> {
                val deltaX = event.rawX - startX
                val deltaY = event.rawY - startY
                val distance = sqrt(deltaX * deltaX + deltaY * deltaY)
                
                // Start dragging if moved beyond threshold
                if (distance > touchSlop && !isDragging) {
                    Log.d("MovableTextView", "Starting drag for text view ID: $textViewId (distance: $distance)")
                    isDragging = true
                    
                    // If we were in edit mode, exit it
                    if (isInEditMode) {
                        Log.d("MovableTextView", "Exiting edit mode due to drag")
                        clearFocus()
                        hideKeyboard()
                        isInEditMode = false
                    }
                    
                    parent.requestDisallowInterceptTouchEvent(true)
                }
                
                // If dragging, update position
                if (isDragging) {
                    x = initialX + deltaX
                    y = initialY + deltaY
                    return true
                }
                
                // If in edit mode and not dragging, let EditText handle for text selection
                if (isInEditMode && hasFocus()) {
                    return super.onTouchEvent(event)
                }
                
                return true
            }
            
            MotionEvent.ACTION_UP -> {
                Log.d("MovableTextView", "ACTION_UP, isDragging: $isDragging")
                
                if (isDragging) {
                    // End drag
                    Log.d("MovableTextView", "Drag ended for text view ID: $textViewId")
                    isDragging = false
                    parent.requestDisallowInterceptTouchEvent(false)
                    
                    // Log final position for debugging
                    Log.d("MovableTextView", "Final position: ($x, $y)")
                    
                    // Notify position change so it can be saved to bitmap
                    onPositionChangedListener?.invoke(this@MovableTextView)
                    
                    return true
                }
                
                // If in edit mode, let EditText handle
                if (isInEditMode && hasFocus()) {
                    return super.onTouchEvent(event)
                }
                
                return true
            }
            
            MotionEvent.ACTION_CANCEL -> {
                // Cancel any ongoing drag
                if (isDragging) {
                    isDragging = false
                    parent.requestDisallowInterceptTouchEvent(false)
                }
                return true
            }
        }
        
        return super.onTouchEvent(event)
    }
    
    // Helper extension for better logging
    private fun MotionEvent.actionToString(): String {
        return when (action) {
            MotionEvent.ACTION_DOWN -> "ACTION_DOWN"
            MotionEvent.ACTION_MOVE -> "ACTION_MOVE"
            MotionEvent.ACTION_UP -> "ACTION_UP"
            MotionEvent.ACTION_CANCEL -> "ACTION_CANCEL"
            else -> "ACTION_${action}"
        }
    }
    
    fun hideKeyboard() {
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(windowToken, 0)
    }
    
    fun exitEditMode() {
        if (isInEditMode) {
            isInEditMode = false
            clearFocus()
            hideKeyboard()
            Log.d("MovableTextView", "Exit edit mode for text view ID: $textViewId")
        }
    }

    override fun onDraw(canvas: Canvas) {
        if (strokeWidthValue > 0) {
            val textPaint = TextPaint(paint)
            textPaint.style = Paint.Style.STROKE
            textPaint.strokeWidth = strokeWidthValue
            textPaint.color = strokeColorValue
            
            val lines = text.toString().split("\n")
            val lineHeight = textPaint.fontMetrics.let { it.bottom - it.top }
            val totalHeight = lineHeight * lines.size
            val startY = (height - totalHeight) / 2 - textPaint.fontMetrics.top
            
            lines.forEachIndexed { index, line ->
                val lineY = startY + (lineHeight * index)
                val lineWidth = textPaint.measureText(line)
                val lineX = (width - lineWidth) / 2
                canvas.drawText(line, lineX, lineY, textPaint)
            }
        }
        super.onDraw(canvas)
    }

    fun setImageBounds(width: Int, height: Int, left: Float, top: Float) {
        imageWidth = width
        imageHeight = height
        imageLeft = left
        imageTop = top
    }

    fun getImageRelativePosition(): Pair<Float, Float> {
        if (imageWidth == 0 || imageHeight == 0) {
            return Pair(x, y)
        }
        
        val relativeX = (x - imageLeft) / imageWidth
        val relativeY = (y - imageTop) / imageHeight
        return Pair(relativeX, relativeY)
    }

    fun setImageRelativePosition(relativeX: Float, relativeY: Float) {
        if (imageWidth == 0 || imageHeight == 0) {
            return
        }
        
        x = imageLeft + (relativeX * imageWidth)
        y = imageTop + (relativeY * imageHeight)
    }

    fun getTextData(): TextData {
        val (relativeX, relativeY) = getImageRelativePosition()
        return TextData(
            text = text.toString(),
            x = relativeX,
            y = relativeY,
            size = textSize,
            fontType = fontType,
            textColor = textColorValue,
            strokeColor = strokeColorValue,
            strokeWidth = strokeWidthValue
        )
    }

    fun getTextOverlayBitmap(outputWidth: Int, outputHeight: Int): Bitmap {
        val bitmap = Bitmap.createBitmap(outputWidth, outputHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        // Get text properties
        val textStr = text.toString()
        if (textStr.isEmpty()) return bitmap
        
        // Calculate scaling factor from view size to output size
        val scaleX = outputWidth.toFloat() / imageWidth
        val scaleY = outputHeight.toFloat() / imageHeight
        val scale = minOf(scaleX, scaleY)
        
        // Get relative position
        val (relativeX, relativeY) = getImageRelativePosition()
        
        // Calculate position on output bitmap
        val outputX = relativeX * outputWidth
        val outputY = relativeY * outputHeight
        
        // Create paint with scaled text size
        val paint = TextPaint().apply {
            color = textColorValue
            textSize = this@MovableTextView.textSize * scale
            typeface = when (fontType) {
                FontType.NORMAL -> Typeface.DEFAULT
                FontType.BOLD -> Typeface.DEFAULT_BOLD
                FontType.ITALIC -> Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
                FontType.SERIF -> Typeface.SERIF
                FontType.MONOSPACE -> Typeface.MONOSPACE
                FontType.CASUAL -> {
                    try {
                        Typeface.create("casual", Typeface.BOLD)
                    } catch (e: Exception) {
                        Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
                    }
                }
                FontType.CURSIVE -> {
                    try {
                        Typeface.create("cursive", Typeface.NORMAL)
                    } catch (e: Exception) {
                        Typeface.create(Typeface.SERIF, Typeface.ITALIC)
                    }
                }
            }
            
            // Apply same styling as in view for consistency
            when (fontType) {
                FontType.CURSIVE -> {
                    setShadowLayer(4f, 2f, 2f, Color.BLACK)
                    textScaleX = 1.3f
                    // Note: rotation cannot be applied to paint, only to canvas
                }
                FontType.CASUAL -> {
                    setShadowLayer(3f, 1f, 1f, Color.BLUE)
                    textScaleX = 0.9f
                }
                else -> {
                    textScaleX = 1.0f
                }
            }
            
            isAntiAlias = true
        }
        
        // Draw stroke if needed
        if (strokeWidthValue > 0) {
            val strokePaint = TextPaint(paint).apply {
                style = Paint.Style.STROKE
                strokeWidth = strokeWidthValue * scale
                color = strokeColorValue
            }
            
            val lines = textStr.split("\n")
            val lineHeight = strokePaint.fontMetrics.let { it.bottom - it.top }
            
            lines.forEachIndexed { index, line ->
                val lineY = outputY + (lineHeight * index) - strokePaint.fontMetrics.top
                val lineWidth = strokePaint.measureText(line)
                val lineX = outputX - (lineWidth / 2)
                canvas.drawText(line, lineX, lineY, strokePaint)
            }
        }
        
        // Draw main text
        val lines = textStr.split("\n")
        val lineHeight = paint.fontMetrics.let { it.bottom - it.top }
        
        lines.forEachIndexed { index, line ->
            val lineY = outputY + (lineHeight * index) - paint.fontMetrics.top
            val lineWidth = paint.measureText(line)
            val lineX = outputX - (lineWidth / 2)
            canvas.drawText(line, lineX, lineY, paint)
        }
        
        return bitmap
    }

    data class TextData(
        val text: String,
        val x: Float,
        val y: Float,
        val size: Float,
        val fontType: FontType,
        val textColor: Int,
        val strokeColor: Int,
        val strokeWidth: Float
    )
}
