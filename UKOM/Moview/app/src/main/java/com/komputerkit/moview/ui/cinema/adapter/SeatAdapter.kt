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
    private val onSeatChanged: (selectedSeats: List<Seat>, total: Int) -> Unit
) : RecyclerView.Adapter<SeatAdapter.ViewHolder>() {

    private var colorTextPrimary: Int? = null
    private var colorTextSecondary: Int? = null
    private var colorWhite: Int? = null
    private var colorRose: Int? = null
    private var colorPurple: Int? = null
    private var colorGreen: Int? = null

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
            colorRose = ContextCompat.getColor(view.context, R.color.seat_couple_text)
            colorPurple = ContextCompat.getColor(view.context, R.color.seat_premium_text)
            colorGreen = ContextCompat.getColor(view.context, R.color.seat_wheelchair_text)
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

        if (seat.type == SeatType.AISLE || seat.type == SeatType.ENTRANCE) {
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

        when (seat.type) {
            SeatType.COUPLE -> {
                if (seat.status == SeatStatus.SELECTED) {
                    holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                    holder.tv.setTextColor(colorWhite ?: ContextCompat.getColor(holder.tv.context, android.R.color.white))
                } else {
                    holder.tv.setBackgroundResource(R.drawable.bg_seat_couple)
                    holder.tv.setTextColor(colorRose ?: ContextCompat.getColor(holder.tv.context, R.color.seat_couple_text))
                }
            }
            SeatType.PREMIUM -> {
                if (seat.status == SeatStatus.SELECTED) {
                    holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                    holder.tv.setTextColor(colorWhite ?: ContextCompat.getColor(holder.tv.context, android.R.color.white))
                } else {
                    holder.tv.setBackgroundResource(R.drawable.bg_seat_premium)
                    holder.tv.setTextColor(colorPurple ?: ContextCompat.getColor(holder.tv.context, R.color.seat_premium_text))
                }
            }
            SeatType.WHEELCHAIR -> {
                if (seat.status == SeatStatus.SELECTED) {
                    holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                    holder.tv.setTextColor(colorWhite ?: ContextCompat.getColor(holder.tv.context, android.R.color.white))
                } else {
                    holder.tv.setBackgroundResource(R.drawable.bg_seat_wheelchair)
                    holder.tv.setTextColor(colorGreen ?: ContextCompat.getColor(holder.tv.context, R.color.seat_wheelchair_text))
                }
            }
            else -> {
                when (seat.status) {
                    SeatStatus.AVAILABLE -> {
                        holder.tv.setBackgroundResource(R.drawable.bg_seat_available)
                        holder.tv.setTextColor(colorTextPrimary ?: ContextCompat.getColor(holder.tv.context, R.color.text_primary))
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
                    SeatStatus.SELECTED -> {
                        holder.tv.setBackgroundResource(R.drawable.bg_seat_selected)
                        holder.tv.setTextColor(colorWhite ?: ContextCompat.getColor(holder.tv.context, android.R.color.white))
                        holder.tv.isEnabled = true
                    }
                }
            }
        }

        holder.tv.setOnClickListener {
            if (seat.type == SeatType.UNAVAILABLE || seat.status == SeatStatus.BOOKED) return@setOnClickListener
            if (seat.status == SeatStatus.UNAVAILABLE) return@setOnClickListener

            // Couple/sweetbox: selecting one cell selects its partner (same seat_group)
            if (seat.type == SeatType.COUPLE && seat.seatGroup != null) {
                val groupIndexes = seats.indices.filter { i ->
                    seats[i].seatGroup == seat.seatGroup
                }
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

    private fun notifySeatChange() {
        val selected = seats.filter { it.type in SELECTABLE_TYPES && it.status == SeatStatus.SELECTED }
        onSeatChanged(selected, selected.sumOf { it.price })
    }

    override fun getItemCount() = seats.size

    fun submitSeats(newSeats: List<Seat>) {
        seats.clear()
        seats.addAll(newSeats)
        notifyDataSetChanged()
        notifySeatChange()
    }

    fun getSelectedSeats(): List<Seat> = seats.filter { it.type in SELECTABLE_TYPES && it.status == SeatStatus.SELECTED }

    fun getSeatsSnapshot(): List<Seat> = seats.toList()

    fun getRealSeatsSnapshot(): List<Seat> = seats.filter { it.type in SELECTABLE_TYPES }

    companion object {
        val SELECTABLE_TYPES = setOf(SeatType.SEAT, SeatType.COUPLE, SeatType.PREMIUM, SeatType.WHEELCHAIR)
    }
}