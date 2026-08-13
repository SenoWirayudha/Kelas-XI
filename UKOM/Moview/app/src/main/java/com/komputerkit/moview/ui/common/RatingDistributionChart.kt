package com.komputerkit.moview.ui.common

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View

/**
 * Vertical rating distribution chart (Letterboxd-style).
 * Renders 10 thin bars for buckets 0.5 - 5.0 with relative scaling
 * (bar height proportional to the bucket with the highest count).
 * Only whole-number buckets (1..5) get x-axis labels.
 */
class RatingDistributionChart @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val values = IntArray(10)

    private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = DEFAULT_BAR_COLOR
        style = Paint.Style.FILL
    }
    private val baselinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = DEFAULT_BASELINE_COLOR
        strokeWidth = dp(1f)
    }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = DEFAULT_LABEL_COLOR
        textAlign = Paint.Align.CENTER
        textSize = dp(10f)
    }

    fun setBarColor(color: Int) {
        barPaint.color = color
        invalidate()
    }

    fun setDistribution(counts: List<Int>) {
        require(counts.size == 10) { "Expected 10 buckets (0.5-5.0), got ${counts.size}" }
        for (i in 0 until 10) {
            values[i] = counts[i].coerceAtLeast(0)
        }
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val labelSpace = dp(16f)
        val topPadding = dp(6f)
        val bottom = height.toFloat() - labelSpace
        val chartTop = topPadding
        val chartHeight = (bottom - chartTop).coerceAtLeast(1f)

        // Draw baseline
        canvas.drawLine(0f, bottom, width.toFloat(), bottom, baselinePaint)

        val maxValue = values.maxOrNull() ?: 0
        if (maxValue <= 0) return

        val columnWidth = width / 10f
        val barWidth = columnWidth * 0.8f
        val barGap = columnWidth * 0.2f

        values.forEachIndexed { index, count ->
            val barHeight = if (count > 0) {
                (count.toFloat() / maxValue) * chartHeight
            } else {
                dp(2f)
            }
            val left = index * columnWidth + barGap / 2f
            val right = left + barWidth
            val barTop = bottom - barHeight

            canvas.drawRoundRect(
                RectF(left, barTop, right, bottom),
                dp(2f),
                dp(2f),
                barPaint
            )

            // X-axis label only for whole-number buckets (1.0, 2.0, ... 5.0)
            if (index % 2 == 1) {
                val labelValue = (index + 1) / 2
                val cx = left + barWidth / 2f
                val cy = bottom + dp(12f)
                canvas.drawText(labelValue.toString(), cx, cy, labelPaint)
            }
        }
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    companion object {
        private const val DEFAULT_BAR_COLOR = 0xFF1E88E5.toInt()
        private const val DEFAULT_BASELINE_COLOR = 0xFF2E3A47.toInt()
        private const val DEFAULT_LABEL_COLOR = 0xFF8A94A6.toInt()
    }
}