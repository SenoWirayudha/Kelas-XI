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
    private val onDateClick: (Int) -> Unit
) : RecyclerView.Adapter<DateTabAdapter.ViewHolder>() {

    private var selectedPosition = 0

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
        holder.itemView.setBackgroundResource(
            if (isSelected) R.drawable.bg_date_tab_selected else R.drawable.bg_date_tab_default
        )
        holder.tvDay.setTextColor(
            holder.itemView.context.getColor(if (isSelected) R.color.white else R.color.text_primary)
        )
        holder.tvLabel.setTextColor(
            holder.itemView.context.getColor(if (isSelected) android.R.color.white else R.color.text_secondary)
        )

        holder.itemView.setOnClickListener {
            val prev = selectedPosition
            selectedPosition = position
            notifyItemChanged(prev)
            notifyItemChanged(position)
            onDateClick(position)
        }
    }

    override fun getItemCount() = dates.size
}
