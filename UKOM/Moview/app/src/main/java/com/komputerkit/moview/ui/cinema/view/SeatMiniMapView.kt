package com.komputerkit.moview.ui.cinema.view

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import com.komputerkit.moview.ui.cinema.model.Seat
import com.komputerkit.moview.ui.cinema.model.SeatStatus
import com.komputerkit.moview.ui.cinema.model.SeatType
import kotlin.math.max
import kotlin.math.min

class SeatMiniMapView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var rows: Int = 1
    private var columns: Int = 1
    private var seats: List<Seat> = emptyList()

    private var horizontalOffsetPx: Int = 0
    private var horizontalRangePx: Int = 1
    private var horizontalExtentPx: Int = 1

    private var verticalOffsetPx: Int = 0
    private var verticalRangePx: Int = 1
    private var verticalExtentPx: Int = 1

    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#161A22")
        style = Paint.Style.FILL
    }

    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#554A4F5C")
        style = Paint.Style.STROKE
        strokeWidth = dp(1f)
    }

    private val availablePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#3A3F49")
        style = Paint.Style.FILL
    }

    private val bookedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#1A1F29")
        style = Paint.Style.FILL
    }

    private val selectedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#4A4CE8")
        style = Paint.Style.FILL
    }

    private val aislePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#161A22")
        style = Paint.Style.FILL
    }

    private val viewportPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#22FFFFFF")
        style = Paint.Style.STROKE
        strokeWidth = dp(1.5f)
    }

    private val viewportFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    }

    private val bgRect = RectF()
    private val mapRect = RectF()
    private val cellRect = RectF()
    private val viewportRect = RectF()

    fun updateSeats(rows: Int, columns: Int, seats: List<Seat>) {
        val nextRows = rows.coerceAtLeast(1)
        val nextColumns = columns.coerceAtLeast(1)
        if (this.rows == nextRows && this.columns == nextColumns && this.seats === seats) return
        this.rows = nextRows
        this.columns = nextColumns
        this.seats = seats
        invalidate()
    }

    fun updateViewport(
        horizontalOffsetPx: Int,
        horizontalRangePx: Int,
        horizontalExtentPx: Int,
        verticalOffsetPx: Int,
        verticalRangePx: Int,
        verticalExtentPx: Int
    ) {
        val nextHorizontalOffsetPx = horizontalOffsetPx.coerceAtLeast(0)
        val nextHorizontalRangePx = max(horizontalRangePx, 1)
        val nextHorizontalExtentPx = max(horizontalExtentPx, 1)

        val nextVerticalOffsetPx = verticalOffsetPx.coerceAtLeast(0)
        val nextVerticalRangePx = max(verticalRangePx, 1)
        val nextVerticalExtentPx = max(verticalExtentPx, 1)

        if (
            nextHorizontalOffsetPx == this.horizontalOffsetPx &&
            nextHorizontalRangePx == this.horizontalRangePx &&
            nextHorizontalExtentPx == this.horizontalExtentPx &&
            nextVerticalOffsetPx == this.verticalOffsetPx &&
            nextVerticalRangePx == this.verticalRangePx &&
            nextVerticalExtentPx == this.verticalExtentPx
        ) return

        this.horizontalOffsetPx = nextHorizontalOffsetPx
        this.horizontalRangePx = nextHorizontalRangePx
        this.horizontalExtentPx = nextHorizontalExtentPx

        this.verticalOffsetPx = nextVerticalOffsetPx
        this.verticalRangePx = nextVerticalRangePx
        this.verticalExtentPx = nextVerticalExtentPx
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val radius = dp(8f)
        bgRect.set(0f, 0f, width.toFloat(), height.toFloat())
        canvas.drawRoundRect(bgRect, radius, radius, bgPaint)
        canvas.drawRoundRect(bgRect, radius, radius, borderPaint)

        val inset = dp(6f)
        mapRect.set(inset, inset, width - inset, height - inset)

        if (mapRect.width() <= 0f || mapRect.height() <= 0f) return

        val baseSeatSize = dp(6f)
        val scaleX = mapRect.width() / (columns * baseSeatSize)
        val scaleY = mapRect.height() / (rows * baseSeatSize)
        val scale = min(scaleX, scaleY).coerceAtMost(1f)

        val seatWidth = mapRect.width() / columns
val seatHeight = (mapRect.height() / rows) * 0.8f


        val totalGridWidth = seatWidth * columns
        val totalGridHeight = seatHeight * rows

        val offsetX = (mapRect.width() - totalGridWidth) / 2f
        val offsetY = (mapRect.height() - totalGridHeight) / 2f

        val gap = dp(0.5f)

        for (seat in seats) {
            if (seat.type != SeatType.SEAT) continue
            val x = (seat.positionX - 1).coerceAtLeast(0)
            val y = (seat.positionY - 1).coerceAtLeast(0)

            val left = mapRect.left + offsetX + (x * seatWidth)
            val top = mapRect.top + offsetY + (y * seatHeight)
            val right = left + seatWidth
            val bottom = top + seatHeight

            cellRect.set(
                left + gap,
                top + gap,
                right - gap,
                bottom - gap
            )

            val seatPaint = when (seat.status) {
                SeatStatus.AVAILABLE -> availablePaint
                SeatStatus.BOOKED -> bookedPaint
                SeatStatus.SELECTED -> selectedPaint
            }
            canvas.drawRect(cellRect, seatPaint)
            canvas.drawRoundRect(cellRect, dp(1f), dp(1f), seatPaint)
        }

        drawViewport(canvas)
    }

    private fun drawViewport(canvas: Canvas) {
        val horizontalDenominator = max(horizontalRangePx - horizontalExtentPx, 1)
        val verticalDenominator = max(verticalRangePx - verticalExtentPx, 1)

        val viewportWidthFraction = (horizontalExtentPx.toFloat() / horizontalRangePx.toFloat()).coerceIn(0f, 1f)
        val viewportHeightFraction = (verticalExtentPx.toFloat() / verticalRangePx.toFloat()).coerceIn(0f, 1f)

        val maxLeftFraction = (1f - viewportWidthFraction).coerceAtLeast(0f)
        val maxTopFraction = (1f - viewportHeightFraction).coerceAtLeast(0f)

        val leftFraction = ((horizontalOffsetPx.toFloat() / horizontalDenominator.toFloat()) * maxLeftFraction)
            .coerceIn(0f, maxLeftFraction)
        val topFraction = ((verticalOffsetPx.toFloat() / verticalDenominator.toFloat()) * maxTopFraction)
            .coerceIn(0f, maxTopFraction)

        val viewportLeft = mapRect.left + (leftFraction * mapRect.width())
        val viewportTop = mapRect.top + (topFraction * mapRect.height())
        val viewportRight = viewportLeft + (viewportWidthFraction * mapRect.width())
        val viewportBottom = viewportTop + (viewportHeightFraction * mapRect.height())

        viewportRect.set(
            viewportLeft,
            viewportTop,
            viewportRight.coerceAtMost(mapRect.right),
            viewportBottom.coerceAtMost(mapRect.bottom)
        )

        val radius = dp(2f)
        canvas.drawRoundRect(viewportRect, radius, radius, viewportPaint)    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density
}
