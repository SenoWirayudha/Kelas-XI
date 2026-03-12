package com.komputerkit.moview.ui.cinema.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.Seat
import com.komputerkit.moview.ui.cinema.model.SeatStatus

class SeatAdapter(
    private val seats: MutableList<Seat>,
    private val columnCount: Int,
    private val ticketPrice: Int,
    private val onSeatChanged: (selectedSeats: List<Seat>, total: Int) -> Unit
) : RecyclerView.Adapter<SeatAdapter.ViewHolder>() {

    inner class ViewHolder(val tv: TextView) : RecyclerView.ViewHolder(tv)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val tv = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_seat, parent, false) as TextView
        return ViewHolder(tv)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val seat = seats[position]
        holder.tv.text = seat.id

        when (seat.status) {
            SeatStatus.AVAILABLE -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_available)
                holder.tv.setTextColor(ContextCompat.getColor(holder.tv.context, R.color.text_primary))
                holder.tv.isEnabled = true
                holder.tv.alpha = 1f
            }
            SeatStatus.BOOKED -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_booked)
                holder.tv.setTextColor(ContextCompat.getColor(holder.tv.context, R.color.text_secondary))
                holder.tv.isEnabled = false
                holder.tv.alpha = 0.5f
            }
            SeatStatus.SELECTED -> {
                holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                holder.tv.setTextColor(ContextCompat.getColor(holder.tv.context, android.R.color.white))
                holder.tv.isEnabled = true
                holder.tv.alpha = 1f
            }
        }

        holder.tv.setOnClickListener {
            if (seat.status == SeatStatus.BOOKED) return@setOnClickListener
            seats[position] = seat.copy(
                status = if (seat.status == SeatStatus.SELECTED)
                    SeatStatus.AVAILABLE else SeatStatus.SELECTED
            )
            notifyItemChanged(position)
            val selected = seats.filter { it.status == SeatStatus.SELECTED }
            onSeatChanged(selected, selected.size * ticketPrice)
        }
    }

    override fun getItemCount() = seats.size

    fun getSelectedSeats(): List<Seat> = seats.filter { it.status == SeatStatus.SELECTED }
}
