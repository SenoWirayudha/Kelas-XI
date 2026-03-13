package com.komputerkit.moview.ui.cinema.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.ShowDate

class DateTabAdapter(
    private val dates: List<ShowDate>,
    initialSelectedPosition: Int = 0,
    private val onDateClick: (Int) -> Unit
) : RecyclerView.Adapter<DateTabAdapter.ViewHolder>() {

    private var selectedPosition = initialSelectedPosition.coerceIn(0, (dates.size - 1).coerceAtLeast(0))

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvDay: TextView = view.findViewById(R.id.tv_day)
        val tvLabel: TextView = view.findViewById(R.id.tv_label)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_date_tab, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val date = dates[position]
        holder.tvDay.text = "${date.day} ${date.month}"
        holder.tvLabel.text = date.label

        val isSelected = position == selectedPosition
        val isEnabled = date.isEnabled
        holder.itemView.setBackgroundResource(
            if (isSelected) R.drawable.bg_date_tab_selected else R.drawable.bg_date_tab_default
        )
        holder.tvDay.setTextColor(
            holder.itemView.context.getColor(
                when {
                    !isEnabled -> R.color.text_secondary
                    isSelected -> R.color.white
                    else -> R.color.text_primary
                }
            )
        )
        holder.tvLabel.setTextColor(
            holder.itemView.context.getColor(
                when {
                    !isEnabled -> R.color.text_secondary
                    isSelected -> android.R.color.white
                    else -> R.color.text_secondary
                }
            )
        )
        holder.itemView.alpha = if (isEnabled) 1f else 0.45f
        holder.itemView.isEnabled = isEnabled

        holder.itemView.setOnClickListener {
            if (!isEnabled) return@setOnClickListener
            val prev = selectedPosition
            selectedPosition = position
            notifyItemChanged(prev)
            notifyItemChanged(position)
            onDateClick(position)
        }
    }

    override fun getItemCount() = dates.size
}
