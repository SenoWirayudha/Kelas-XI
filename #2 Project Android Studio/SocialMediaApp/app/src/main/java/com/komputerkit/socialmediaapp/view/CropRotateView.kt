package com.komputerkit.socialmediaapp.view

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.util.Log
import android.view.MotionEvent
import android.view.View
import kotlin.math.*

class CropRotateView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var originalBitmap: Bitmap? = null
    private var processedBitmap: Bitmap? = null
    private var currentRotation = 0f
    
    // Crop properties
    private var isCropMode = false
    private var cropRect = RectF()
    private var cropBounds = RectF()
    private val cropPaint = Paint().apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 4f
        pathEffect = DashPathEffect(floatArrayOf(10f, 10f), 0f)
    }
    private val dimPaint = Paint().apply {
        color = Color.BLACK
        alpha = 128
    }
    
    // Touch handling for crop
    private var isDragging = false
    private var dragHandle = CropHandle.NONE
    private var lastTouchX = 0f
    private var lastTouchY = 0f
    private val handleSize = 40f
    
    // Transformation matrix for display
    private val displayMatrix = Matrix()
    private val imageRect = RectF()
    
    enum class CropHandle {
        NONE, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, CENTER
    }
    
    interface OnImageChangedListener {
        fun onImageRotated(rotation: Float)
        fun onImageCropped(cropRect: RectF)
    }
    
    private var onImageChangedListener: OnImageChangedListener? = null
    
    fun setOnImageChangedListener(listener: OnImageChangedListener) {
        onImageChangedListener = listener
    }
    
    fun setOriginalBitmap(bitmap: Bitmap) {
        originalBitmap = bitmap
        resetCrop()
        updateProcessedBitmap()
        invalidate()
    }
    
    fun setCropMode(enabled: Boolean) {
        isCropMode = enabled
        if (enabled) {
            resetCrop()
        }
        invalidate()
    }
    
    private fun resetCrop() {
        originalBitmap?.let { bitmap ->
            val scale = calculateDisplayScale(bitmap)
            val scaledWidth = bitmap.width * scale
            val scaledHeight = bitmap.height * scale
            val centerX = width / 2f
            val centerY = height / 2f
            
            cropRect.set(
                centerX - scaledWidth * 0.4f,
                centerY - scaledHeight * 0.4f,
                centerX + scaledWidth * 0.4f,
                centerY + scaledHeight * 0.4f
            )
            
            imageRect.set(
                centerX - scaledWidth / 2f,
                centerY - scaledHeight / 2f,
                centerX + scaledWidth / 2f,
                centerY + scaledHeight / 2f
            )
        }
    }
    
    private fun calculateDisplayScale(bitmap: Bitmap): Float {
        val viewWidth = width.toFloat()
        val viewHeight = height.toFloat()
        val bitmapWidth = bitmap.width.toFloat()
        val bitmapHeight = bitmap.height.toFloat()
        
        return minOf(viewWidth / bitmapWidth, viewHeight / bitmapHeight) * 0.8f
    }
    
    fun rotateImage(degrees: Float) {
        currentRotation = (currentRotation + degrees) % 360f
        updateProcessedBitmap()
        onImageChangedListener?.onImageRotated(currentRotation)
        invalidate()
    }
    
    fun applyCrop() {
        if (!isCropMode) return
        
        originalBitmap?.let { bitmap ->
            // Convert crop rectangle to bitmap coordinates
            val scale = calculateDisplayScale(bitmap)
            val bitmapCropRect = RectF()
            
            bitmapCropRect.left = (cropRect.left - imageRect.left) / scale
            bitmapCropRect.top = (cropRect.top - imageRect.top) / scale
            bitmapCropRect.right = (cropRect.right - imageRect.left) / scale
            bitmapCropRect.bottom = (cropRect.bottom - imageRect.top) / scale
            
            // Ensure crop rect is within bitmap bounds
            bitmapCropRect.intersect(0f, 0f, bitmap.width.toFloat(), bitmap.height.toFloat())
            
            if (bitmapCropRect.width() > 0 && bitmapCropRect.height() > 0) {
                // Additional validation to prevent IllegalArgumentException
                var x = bitmapCropRect.left.toInt()
                var y = bitmapCropRect.top.toInt()
                var width = bitmapCropRect.width().toInt()
                var height = bitmapCropRect.height().toInt()
                
                // Validasi koordinat crop
                x = maxOf(0, x)
                y = maxOf(0, y)
                
                // Pastikan tidak melebihi batas bitmap
                if (x + width > bitmap.width) {
                    width = bitmap.width - x
                }
                if (y + height > bitmap.height) {
                    height = bitmap.height - y
                }
                
                // Pastikan ukuran minimal 1 pixel
                width = maxOf(1, width)
                height = maxOf(1, height)
                
                Log.d("CropRotateView", "Applying crop - Bitmap: ${bitmap.width}x${bitmap.height}, Crop: x=$x, y=$y, w=$width, h=$height")
                
                try {
                    val croppedBitmap = Bitmap.createBitmap(bitmap, x, y, width, height)
                    
                    originalBitmap = croppedBitmap
                    currentRotation = 0f
                    updateProcessedBitmap()
                    
                    // Convert back to relative coordinates for callback
                    val relativeCropRect = RectF(
                        x.toFloat() / bitmap.width,
                        y.toFloat() / bitmap.height,
                        (x + width).toFloat() / bitmap.width,
                        (y + height).toFloat() / bitmap.height
                    )
                    onImageChangedListener?.onImageCropped(relativeCropRect)
                    setCropMode(false)
                    
                    Log.d("CropRotateView", "Crop applied successfully")
                } catch (e: IllegalArgumentException) {
                    Log.e("CropRotateView", "Crop failed: ${e.message}")
                    Log.e("CropRotateView", "Bitmap: ${bitmap.width}x${bitmap.height}, Crop: x=$x, y=$y, w=$width, h=$height")
                }
            }
        }
    }
    
    private fun updateProcessedBitmap() {
        originalBitmap?.let { bitmap ->
            if (currentRotation == 0f) {
                processedBitmap = bitmap
            } else {
                val matrix = Matrix().apply {
                    postRotate(currentRotation, bitmap.width / 2f, bitmap.height / 2f)
                }
                
                // 🔧 Buat bitmap baru dengan background transparent (tidak reuse yang lama)
                processedBitmap = Bitmap.createBitmap(
                    bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true
                )
            }
            
            // Force redraw after processing
            invalidate()
        }
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (isCropMode) {
            resetCrop()
        }
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        // 🔧 CLEAR CANVAS sebelum menggambar untuk mencegah gambar dobel
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
        
        processedBitmap?.let { bitmap ->
            val scale = calculateDisplayScale(bitmap)
            val scaledWidth = bitmap.width * scale
            val scaledHeight = bitmap.height * scale
            val centerX = width / 2f
            val centerY = height / 2f
            
            val destRect = RectF(
                centerX - scaledWidth / 2f,
                centerY - scaledHeight / 2f,
                centerX + scaledWidth / 2f,
                centerY + scaledHeight / 2f
            )
            
            // Draw ONLY the current processed bitmap (tidak menumpuk)
            canvas.drawBitmap(bitmap, null, destRect, null)
            
            if (isCropMode) {
                drawCropOverlay(canvas, destRect)
            }
        }
    }
    
    private fun drawCropOverlay(canvas: Canvas, imageRect: RectF) {
        // Draw dim overlay outside crop area
        canvas.drawRect(0f, 0f, width.toFloat(), cropRect.top, dimPaint)
        canvas.drawRect(0f, cropRect.bottom, width.toFloat(), height.toFloat(), dimPaint)
        canvas.drawRect(0f, cropRect.top, cropRect.left, cropRect.bottom, dimPaint)
        canvas.drawRect(cropRect.right, cropRect.top, width.toFloat(), cropRect.bottom, dimPaint)
        
        // Draw crop rectangle
        canvas.drawRect(cropRect, cropPaint)
        
        // Draw crop handles
        drawCropHandle(canvas, cropRect.left, cropRect.top)
        drawCropHandle(canvas, cropRect.right, cropRect.top)
        drawCropHandle(canvas, cropRect.left, cropRect.bottom)
        drawCropHandle(canvas, cropRect.right, cropRect.bottom)
    }
    
    private fun drawCropHandle(canvas: Canvas, x: Float, y: Float) {
        canvas.drawCircle(x, y, handleSize / 2, cropPaint.apply { style = Paint.Style.FILL })
        canvas.drawCircle(x, y, handleSize / 2, cropPaint.apply { 
            style = Paint.Style.STROKE
            strokeWidth = 2f
        })
    }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        // Only handle touch events when crop mode is enabled
        if (!isCropMode) {
            Log.d("CropRotateView", "Crop mode disabled - not handling touch")
            return false
        }
        
        Log.d("CropRotateView", "onTouchEvent: ${event.action}, isCropMode: $isCropMode")
        
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                lastTouchX = event.x
                lastTouchY = event.y
                dragHandle = getTouchedHandle(event.x, event.y)
                isDragging = dragHandle != CropHandle.NONE
                
                Log.d("CropRotateView", "ACTION_DOWN - handle: $dragHandle, isDragging: $isDragging")
                
                // Only consume the event if we detected a handle touch
                return isDragging
            }
            
            MotionEvent.ACTION_MOVE -> {
                if (isDragging) {
                    val deltaX = event.x - lastTouchX
                    val deltaY = event.y - lastTouchY
                    
                    Log.d("CropRotateView", "ACTION_MOVE - handle: $dragHandle, delta: ($deltaX, $deltaY)")
                    
                    when (dragHandle) {
                        CropHandle.TOP_LEFT -> {
                            cropRect.left = minOf(cropRect.left + deltaX, cropRect.right - 50f)
                            cropRect.top = minOf(cropRect.top + deltaY, cropRect.bottom - 50f)
                        }
                        CropHandle.TOP_RIGHT -> {
                            cropRect.right = maxOf(cropRect.right + deltaX, cropRect.left + 50f)
                            cropRect.top = minOf(cropRect.top + deltaY, cropRect.bottom - 50f)
                        }
                        CropHandle.BOTTOM_LEFT -> {
                            cropRect.left = minOf(cropRect.left + deltaX, cropRect.right - 50f)
                            cropRect.bottom = maxOf(cropRect.bottom + deltaY, cropRect.top + 50f)
                        }
                        CropHandle.BOTTOM_RIGHT -> {
                            cropRect.right = maxOf(cropRect.right + deltaX, cropRect.left + 50f)
                            cropRect.bottom = maxOf(cropRect.bottom + deltaY, cropRect.top + 50f)
                        }
                        CropHandle.CENTER -> {
                            cropRect.offset(deltaX, deltaY)
                        }
                        else -> {}
                    }
                    
                    // Keep crop rect within image bounds
                    cropRect.intersect(imageRect)
                    
                    lastTouchX = event.x
                    lastTouchY = event.y
                    invalidate()
                    return true
                }
                return false
            }
            
            MotionEvent.ACTION_UP -> {
                Log.d("CropRotateView", "ACTION_UP - was dragging: $isDragging")
                
                if (isDragging) {
                    isDragging = false
                    dragHandle = CropHandle.NONE
                    return true
                }
                return false
            }
            
            MotionEvent.ACTION_CANCEL -> {
                Log.d("CropRotateView", "ACTION_CANCEL")
                isDragging = false
                dragHandle = CropHandle.NONE
                return false
            }
        }
        
        return false
    }
    
    private fun getTouchedHandle(x: Float, y: Float): CropHandle {
        val touchRadius = handleSize
        
        return when {
            isPointInHandle(x, y, cropRect.left, cropRect.top, touchRadius) -> CropHandle.TOP_LEFT
            isPointInHandle(x, y, cropRect.right, cropRect.top, touchRadius) -> CropHandle.TOP_RIGHT
            isPointInHandle(x, y, cropRect.left, cropRect.bottom, touchRadius) -> CropHandle.BOTTOM_LEFT
            isPointInHandle(x, y, cropRect.right, cropRect.bottom, touchRadius) -> CropHandle.BOTTOM_RIGHT
            cropRect.contains(x, y) -> CropHandle.CENTER
            else -> CropHandle.NONE
        }
    }
    
    private fun isPointInHandle(x: Float, y: Float, handleX: Float, handleY: Float, radius: Float): Boolean {
        val distance = sqrt((x - handleX).pow(2) + (y - handleY).pow(2))
        return distance <= radius
    }
    
    fun getCurrentBitmap(): Bitmap? = processedBitmap
    fun getCurrentRotation(): Float = currentRotation
    
    // Get relative crop coordinates (percentage)
    fun getRelativeCropRect(): RectF? {
        if (!isCropMode) return null
        
        return originalBitmap?.let { bitmap ->
            val scale = calculateDisplayScale(bitmap)
            val relativeCrop = RectF()
            
            relativeCrop.left = (cropRect.left - imageRect.left) / (imageRect.width())
            relativeCrop.top = (cropRect.top - imageRect.top) / (imageRect.height())
            relativeCrop.right = (cropRect.right - imageRect.left) / (imageRect.width())
            relativeCrop.bottom = (cropRect.bottom - imageRect.top) / (imageRect.height())
            
            relativeCrop
        }
    }
    
    fun updateImageAfterRotation() {
        // Update the view after the background image has been rotated
        // This refreshes the display and recalculates the crop bounds
        originalBitmap?.let { bitmap ->
            processedBitmap = bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false)
            resetCrop()
            updateProcessedBitmap()
            invalidate()
        }
    }
}
