package com.komputerkit.moview.ui.cinema.adapter

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.Seat
import com.komputerkit.moview.ui.cinema.model.SeatStatus

class SeatAdapter(
    private val seats: MutableList<Seat>,
    private val onSeatChanged: (selectedSeats: List<Seat>, total: Int) -> Unit
) : RecyclerView.Adapter<SeatAdapter.ViewHolder>() {

    private var colorTextPrimary: Int? = null
    private var colorTextSecondary: Int? = null
    private var colorWhite: Int? = null
    private var cornerRadiusPx: Float = 8f * 2f
    private val bgCache = HashMap<String, GradientDrawable>()

    init {
        setHasStableIds(true)
    }

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tv: TextView = view.findViewById(R.id.tv_seat)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_seat, parent, false)
        if (colorTextPrimary == null) {
            colorTextPrimary = ContextCompat.getColor(view.context, R.color.text_primary)
            colorTextSecondary = ContextCompat.getColor(view.context, R.color.text_secondary)
            colorWhite = ContextCompat.getColor(view.context, android.R.color.white)
        }
        cornerRadiusPx = 8f * view.context.resources.displayMetrics.density
        return ViewHolder(view)
    }

    override fun getItemId(position: Int): Long {
        val seat = seats[position]
        val stableKey = seat.seatId?.toLong()
            ?: (((seat.positionY.toLong() and 0xFFFF) shl 16) or (seat.positionX.toLong() and 0xFFFF))
        return (stableKey shl 8) or (seat.type.key.hashCode() and 0xFF).toLong()
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val seat = seats[position]

        if (seat.type.key == "aisle" || seat.type.key == "entrance") {
            holder.tv.text = ""
            holder.tv.setBackgroundResource(android.R.color.transparent)
            holder.tv.isEnabled = false
            holder.tv.alpha = 0f
            holder.tv.setOnClickListener(null)
            return
        }

        holder.tv.alpha = 1f
        holder.tv.isEnabled = true
        holder.tv.text = seat.id

        when (seat.status) {
            SeatStatus.SELECTED -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                holder.tv.setTextColor(colorWhite ?: ContextCompat.getColor(holder.tv.context, android.R.color.white))
                holder.tv.isEnabled = true
            }
            SeatStatus.BOOKED -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_booked)
                holder.tv.setTextColor(colorTextSecondary ?: ContextCompat.getColor(holder.tv.context, R.color.text_secondary))
                holder.tv.isEnabled = false
                holder.tv.alpha = 0.5f
            }
            SeatStatus.UNAVAILABLE -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_unavailable)
                holder.tv.setTextColor(colorTextSecondary ?: ContextCompat.getColor(holder.tv.context, R.color.text_secondary))
                holder.tv.isEnabled = false
                holder.tv.alpha = 0.6f
            }
            else -> {
                // Available sellable seat → color comes from its dynamic type definition
                holder.tv.background = bgFor(seat)
                holder.tv.setTextColor(textColorFor(seat))
                holder.tv.isEnabled = true
            }
        }

        holder.tv.setOnClickListener {
            if (!seat.type.isSellable || seat.status == SeatStatus.BOOKED || seat.status == SeatStatus.UNAVAILABLE) {
                return@setOnClickListener
            }

            // Paired group: picking one cell toggles the whole group (works for any group size)
            if (seat.type.isPaired && seat.seatGroup != null) {
                val groupIndexes = seats.indices.filter { i -> seats[i].seatGroup == seat.seatGroup }
                val anySelected = groupIndexes.any { seats[it].status == SeatStatus.SELECTED }
                for (i in groupIndexes) {
                    seats[i] = seats[i].copy(
                        status = if (anySelected) SeatStatus.AVAILABLE else SeatStatus.SELECTED
                    )
                    notifyItemChanged(i)
                }
            } else {
                seats[position] = seat.copy(
                    status = if (seat.status == SeatStatus.SELECTED)
                        SeatStatus.AVAILABLE else SeatStatus.SELECTED
                )
                notifyItemChanged(position)
            }
            notifySeatChange()
        }
    }

    private fun bgFor(seat: Seat): GradientDrawable {
        val hex = seat.type.color
        return bgCache.getOrPut(hex) {
            val base = parseHexColor(hex)
            GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = cornerRadiusPx
                setColor(lighten(base, 0.78f))
                setStroke(2, base)
            }
        }
    }

    private fun textColorFor(seat: Seat): Int {
        val base = parseHexColor(seat.type.color)
        return darken(base, 0.35f)
    }

    private fun parseHexColor(hex: String): Int {
        val value = hex.removePrefix("#")
        return if (value.length == 6) {
            try {
                Color.parseColor("#$value")
            } catch (_: IllegalArgumentException) {
                Color.parseColor("#64748B")
            }
        } else {
            Color.parseColor("#64748B")
        }
    }

    /** Returns base mixed towards white by [amount] (0..1). */
    private fun lighten(color: Int, amount: Float): Int {
        val r = Color.red(color) + ((255 - Color.red(color)) * amount).toInt()
        val g = Color.green(color) + ((255 - Color.green(color)) * amount).toInt()
        val b = Color.blue(color) + ((255 - Color.blue(color)) * amount).toInt()
        return Color.rgb(r.coerceIn(0, 255), g.coerceIn(0, 255), b.coerceIn(0, 255))
    }

    /** Returns base mixed towards black by [amount] (0..1). */
    private fun darken(color: Int, amount: Float): Int {
        val r = (Color.red(color) * (1f - amount)).toInt()
        val g = (Color.green(color) * (1f - amount)).toInt()
        val b = (Color.blue(color) * (1f - amount)).toInt()
        return Color.rgb(r.coerceIn(0, 255), g.coerceIn(0, 255), b.coerceIn(0, 255))
    }

    private fun notifySeatChange() {
        val selected = seats.filter { it.type.isSellable && it.status == SeatStatus.SELECTED }
        onSeatChanged(selected, selected.sumOf { it.price })
    }

    override fun getItemCount() = seats.size

    fun submitSeats(newSeats: List<Seat>) {
        seats.clear()
        seats.addAll(newSeats)
        notifyDataSetChanged()
        notifySeatChange()
    }

    fun getSelectedSeats(): List<Seat> = seats.filter { it.type.isSellable && it.status == SeatStatus.SELECTED }

    fun getSeatsSnapshot(): List<Seat> = seats.toList()

    fun getRealSeatsSnapshot(): List<Seat> = seats.filter { it.type.isSellable }
}