package com.komputerkit.moview.ui.cinema.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.ShowTime

class ShowTimeAdapter(
    private val times: List<ShowTime>,
    private val onTimeClick: (ShowTime) -> Unit
) : RecyclerView.Adapter<ShowTimeAdapter.ViewHolder>() {

    private var selectedPosition = -1

    inner class ViewHolder(val tv: TextView) : RecyclerView.ViewHolder(tv)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val tv = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_showtime, parent, false) as TextView
        return ViewHolder(tv)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val time = times[position]
        holder.tv.text = time.time

        val isSelected = position == selectedPosition
        holder.tv.setBackgroundResource(
            if (isSelected) R.drawable.bg_showtime_selected else R.drawable.bg_showtime_default
        )
        holder.tv.setTextColor(
            holder.tv.context.getColor(
                if (isSelected) android.R.color.white else R.color.text_primary
            )
        )

        if (!time.isAvailable) {
            holder.tv.alpha = 0.4f
            holder.tv.isEnabled = false
        } else {
            holder.tv.alpha = 1f
            holder.tv.isEnabled = true
            holder.tv.setOnClickListener {
                if (isSelected) return@setOnClickListener
                val prev = selectedPosition
                selectedPosition = position
                if (prev >= 0) notifyItemChanged(prev)
                notifyItemChanged(position)
                onTimeClick(time)
            }
        }
    }

    override fun getItemCount() = times.size
}
