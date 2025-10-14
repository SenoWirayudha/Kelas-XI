package com.komputerkit.socialmediaapp.view

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.abs

class DrawingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var drawPath = Path()
    private var drawPaint = Paint()
    private var canvasPaint = Paint(Paint.DITHER_FLAG)
    private var drawCanvas: Canvas? = null
    private var canvasBitmap: Bitmap? = null
    
    private val paths = mutableListOf<PathData>()
    private var isDrawingEnabled = false
    
    data class PathData(
        val path: Path,
        val paint: Paint
    )

    init {
        setupDrawing()
    }

    private fun setupDrawing() {
        drawPaint.apply {
            color = Color.WHITE
            isAntiAlias = true
            strokeWidth = 10f
            style = Paint.Style.STROKE
            strokeJoin = Paint.Join.ROUND
            strokeCap = Paint.Cap.ROUND
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        canvasBitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        canvasBitmap?.eraseColor(Color.TRANSPARENT) // Make canvas transparent
        drawCanvas = Canvas(canvasBitmap!!)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvasBitmap?.let { canvas.drawBitmap(it, 0f, 0f, canvasPaint) }
        
        // Draw all saved paths
        for (pathData in paths) {
            canvas.drawPath(pathData.path, pathData.paint)
        }
        
        // Draw current path
        canvas.drawPath(drawPath, drawPaint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isDrawingEnabled) return false
        
        val touchX = event.x
        val touchY = event.y

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                drawPath.moveTo(touchX, touchY)
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                drawPath.lineTo(touchX, touchY)
            }
            MotionEvent.ACTION_UP -> {
                drawCanvas?.drawPath(drawPath, drawPaint)
                
                // Save the current path with its paint settings
                val savedPaint = Paint(drawPaint)
                paths.add(PathData(Path(drawPath), savedPaint))
                
                drawPath.reset()
            }
            else -> return false
        }

        invalidate()
        return true
    }

    fun setBrushSize(size: Float) {
        drawPaint.strokeWidth = size
    }

    fun setBrushColor(color: Int) {
        drawPaint.color = color
    }

    fun setDrawingEnabled(enabled: Boolean) {
        isDrawingEnabled = enabled
        // When drawing is disabled, make sure view doesn't intercept touch events
        isClickable = enabled
        isFocusable = enabled
        if (!enabled) {
            clearFocus()
        }
    }

    fun clearDrawing() {
        paths.clear()
        drawPath.reset()
        canvasBitmap?.eraseColor(Color.TRANSPARENT)
        invalidate()
    }

    fun getDrawingBitmap(): Bitmap? {
        if (canvasBitmap == null) return null
        
        val resultBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val resultCanvas = Canvas(resultBitmap)
        
        // Draw all paths to the result bitmap
        for (pathData in paths) {
            resultCanvas.drawPath(pathData.path, pathData.paint)
        }
        
        return resultBitmap
    }

    fun undoLastStroke() {
        if (paths.isNotEmpty()) {
            paths.removeAt(paths.size - 1)
            redrawCanvas()
        }
    }

    private fun redrawCanvas() {
        canvasBitmap?.eraseColor(Color.TRANSPARENT)
        drawCanvas?.let { canvas ->
            for (pathData in paths) {
                canvas.drawPath(pathData.path, pathData.paint)
            }
        }
        invalidate()
    }
}
