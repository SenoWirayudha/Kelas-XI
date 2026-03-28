package com.komputerkit.moview.ui.cinema.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.Seat
import com.komputerkit.moview.ui.cinema.model.SeatStatus
import com.komputerkit.moview.ui.cinema.model.SeatType

class SeatAdapter(
    private val seats: MutableList<Seat>,
    private val ticketPrice: Int,
    private val onSeatChanged: (selectedSeats: List<Seat>, total: Int) -> Unit
) : RecyclerView.Adapter<SeatAdapter.ViewHolder>() {

    private var colorTextPrimary: Int? = null
    private var colorTextSecondary: Int? = null
    private var colorWhite: Int? = null

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
        return ViewHolder(view)
    }

    override fun getItemId(position: Int): Long {
        val seat = seats[position]
        val stableKey = seat.seatId?.toLong()
            ?: (((seat.positionY.toLong() and 0xFFFF) shl 16) or (seat.positionX.toLong() and 0xFFFF))
        return (stableKey shl 2) or seat.type.ordinal.toLong()
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val seat = seats[position]
        holder.tv.text = if (seat.type == SeatType.SEAT) seat.id else ""

        if (seat.type == SeatType.AISLE) {
            holder.tv.setBackgroundResource(android.R.color.transparent)
            holder.tv.isEnabled = false
            holder.tv.alpha = 0f
            holder.tv.setOnClickListener(null)
            return
        }

        if (seat.type == SeatType.ENTRANCE) {
            holder.tv.setBackgroundResource(android.R.color.transparent)
            holder.tv.isEnabled = false
            holder.tv.alpha = 0f
            holder.tv.setOnClickListener(null)
            return
        }

        when (seat.status) {
            SeatStatus.AVAILABLE -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_available)
                holder.tv.setTextColor(colorTextPrimary ?: ContextCompat.getColor(holder.tv.context, R.color.text_primary))
                holder.tv.isEnabled = true
                holder.tv.alpha = 1f
            }
            SeatStatus.BOOKED -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_booked)
                holder.tv.setTextColor(colorTextSecondary ?: ContextCompat.getColor(holder.tv.context, R.color.text_secondary))
                holder.tv.isEnabled = false
                holder.tv.alpha = 0.5f
            }
            SeatStatus.SELECTED -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                holder.tv.setTextColor(colorWhite ?: ContextCompat.getColor(holder.tv.context, android.R.color.white))
                holder.tv.isEnabled = true
                holder.tv.alpha = 1f
            }
        }

        holder.tv.setOnClickListener {
            if (seat.type != SeatType.SEAT || seat.status == SeatStatus.BOOKED) return@setOnClickListener
            seats[position] = seat.copy(
                status = if (seat.status == SeatStatus.SELECTED)
                    SeatStatus.AVAILABLE else SeatStatus.SELECTED
            )
            notifyItemChanged(position)
            val selected = seats.filter { it.type == SeatType.SEAT && it.status == SeatStatus.SELECTED }
            onSeatChanged(selected, selected.size * ticketPrice)
        }
    }

    override fun getItemCount() = seats.size

    fun submitSeats(newSeats: List<Seat>) {
        seats.clear()
        seats.addAll(newSeats)
        notifyDataSetChanged()
        val selected = seats.filter { it.type == SeatType.SEAT && it.status == SeatStatus.SELECTED }
        onSeatChanged(selected, selected.size * ticketPrice)
    }

    fun getSelectedSeats(): List<Seat> = seats.filter { it.type == SeatType.SEAT && it.status == SeatStatus.SELECTED }

    fun getSeatsSnapshot(): List<Seat> = seats.toList()

    fun getRealSeatsSnapshot(): List<Seat> = seats.filter { it.type == SeatType.SEAT }
}
