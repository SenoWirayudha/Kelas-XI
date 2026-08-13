package com.komputerkit.moview.ui.common

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View

class StarRatingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var activeColor = DEFAULT_ACTIVE_COLOR
    private var emptyColor = DEFAULT_EMPTY_COLOR
    private var editable = false
    private var onRatingChanged: ((Float) -> Unit)? = null

    /**
     * When true, only [rating] ceiling number of stars are drawn (no empty leftover stars).
     * e.g. rating 4.0 -> 4 full stars, rating 3.5 -> 3 full + 1 half (4 total).
     * Designed for display-only places; input keeps a fixed star count.
     */
    var displayMode: Boolean = false
        set(value) {
            field = value
            requestLayout()
            invalidate()
        }

    private val activePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val emptyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val starPath = Path()

    var rating: Float = 0f
        set(value) {
            field = value.coerceIn(0f, starCount.toFloat())
            invalidate()
        }

    var starCount: Int = DEFAULT_STAR_COUNT
        set(value) {
            field = value.coerceIn(1, 10)
            requestLayout()
            invalidate()
        }

    var starSizeDp: Float = DEFAULT_STAR_SIZE_DP
        set(value) {
            field = value
            requestLayout()
            invalidate()
        }

    var starGapDp: Float = DEFAULT_STAR_GAP_DP
        set(value) {
            field = value
            requestLayout()
            invalidate()
        }

    fun setColors(active: Int, empty: Int) {
        activeColor = active
        emptyColor = empty
        activePaint.color = activeColor
        emptyPaint.color = emptyColor
        invalidate()
    }

    fun setEditable(enabled: Boolean, onChange: ((Float) -> Unit)?) {
        editable = enabled
        onRatingChanged = onChange
    }

    private fun effectiveStarCount(): Int {
        return if (displayMode) {
            val shown = kotlin.math.ceil(rating.toDouble()).toInt()
            if (rating <= 0f) 1 else shown.coerceIn(1, DEFAULT_STAR_COUNT)
        } else {
            starCount
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val starSize = dp(starSizeDp)
        val count = effectiveStarCount()
        val desiredWidth = (count * starSize + (count - 1) * dp(starGapDp)).toInt()
        val desiredHeight = starSize.toInt()
        setMeasuredDimension(
            resolveSize(desiredWidth, widthMeasureSpec),
            resolveSize(desiredHeight, heightMeasureSpec)
        )
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val starSize = dp(starSizeDp)
        val starGap = dp(starGapDp)

        updatePath(starSize)

        for (i in 0 until effectiveStarCount()) {
            val left = i * (starSize + starGap)
            val right = left + starSize
            val starIndex = i + 1
            canvas.save()

            when {
                rating >= starIndex -> {
                    canvas.translate(left, 0f)
                    canvas.drawPath(starPath, activePaint)
                }

                rating >= starIndex - 0.5f -> {
                    canvas.translate(left, 0f)
                    canvas.drawPath(starPath, emptyPaint)
                    canvas.save()
                    canvas.clipRect(0f, 0f, starSize / 2f, starSize)
                    canvas.drawPath(starPath, activePaint)
                    canvas.restore()
                }

                else -> {
                    canvas.translate(left, 0f)
                    canvas.drawPath(starPath, emptyPaint)
                }
            }
            canvas.restore()
        }
    }

    private fun updatePath(starSize: Float) {
        starPath.reset()
        val scale = starSize / 20f
        starPath.moveTo((12f - 2f) * scale, (17.27f - 2f) * scale)
        starPath.lineTo((18.18f - 2f) * scale, (21f - 2f) * scale)
        starPath.lineTo((16.54f - 2f) * scale, (13.97f - 2f) * scale)
        starPath.lineTo((22f - 2f) * scale, (9.24f - 2f) * scale)
        starPath.lineTo((14.81f - 2f) * scale, (8.63f - 2f) * scale)
        starPath.lineTo((12f - 2f) * scale, (2f - 2f) * scale)
        starPath.lineTo((9.19f - 2f) * scale, (8.63f - 2f) * scale)
        starPath.lineTo((2f - 2f) * scale, (9.24f - 2f) * scale)
        starPath.lineTo((7.46f - 2f) * scale, (13.97f - 2f) * scale)
        starPath.lineTo((5.82f - 2f) * scale, (21f - 2f) * scale)
        starPath.close()
        activePaint.color = activeColor
        emptyPaint.color = emptyColor
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!editable) return super.onTouchEvent(event)
        if (event.actionMasked != MotionEvent.ACTION_DOWN) return true

        val starSize = dp(starSizeDp)
        val starGap = dp(starGapDp)
        val step = starSize + starGap

        val index = ((event.x - starGap / 2f) / step).toInt().coerceIn(0, starCount - 1)
        val full = (index + 1).toFloat()

        val newRating = when {
            rating == 0f -> full
            rating == full -> full - 0.5f
            rating == full - 0.5f -> full
            else -> full
        }
        rating = newRating
        onRatingChanged?.invoke(newRating)
        return true
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    companion object {
        private const val DEFAULT_STAR_COUNT = 5
        private const val DEFAULT_STAR_SIZE_DP = 18f
        private const val DEFAULT_STAR_GAP_DP = 2f
        private const val DEFAULT_ACTIVE_COLOR = 0xFFE8B84B.toInt()
        private const val DEFAULT_EMPTY_COLOR = 0xFF3D3A34.toInt()
    }
}