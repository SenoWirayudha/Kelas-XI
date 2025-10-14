package com.komputerkit.blogapp.ui.views

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import androidx.appcompat.widget.AppCompatImageView

class CircularImageView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatImageView(context, attrs, defStyleAttr) {

    private val paint = Paint().apply {
        isAntiAlias = true
    }
    
    private val borderPaint = Paint().apply {
        isAntiAlias = true
        style = Paint.Style.STROKE
        color = Color.WHITE
        strokeWidth = 8f
    }

    override fun onDraw(canvas: Canvas) {
        val drawable = drawable ?: return

        val radius = Math.min(width, height) / 2f
        val centerX = width / 2f
        val centerY = height / 2f

        // Save canvas state
        canvas.save()

        // Create circular clipping path
        val path = Path().apply {
            addCircle(centerX, centerY, radius - borderPaint.strokeWidth / 2, Path.Direction.CW)
        }

        // Clip the canvas to the circular path
        canvas.clipPath(path)

        // Draw the image
        super.onDraw(canvas)

        // Restore canvas state
        canvas.restore()

        // Draw border (after restoring canvas)
        canvas.drawCircle(centerX, centerY, radius - borderPaint.strokeWidth / 2, borderPaint)
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        val size = Math.min(measuredWidth, measuredHeight)
        setMeasuredDimension(size, size)
    }
}
