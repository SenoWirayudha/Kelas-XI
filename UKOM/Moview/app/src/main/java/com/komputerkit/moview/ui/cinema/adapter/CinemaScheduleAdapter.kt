package com.komputerkit.moview.ui.cinema.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.CinemaBrand
import com.komputerkit.moview.ui.cinema.model.CinemaSchedule
import com.komputerkit.moview.ui.cinema.model.ShowTime

class CinemaScheduleAdapter(
    private var items: List<CinemaSchedule>,
    private val onTimeClick: (cinema: CinemaSchedule, time: ShowTime) -> Unit
) : RecyclerView.Adapter<CinemaScheduleAdapter.ViewHolder>() {

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(R.id.tv_cinema_name)
        val tvType: TextView = view.findViewById(R.id.tv_studio_type)
        val tvPrice: TextView = view.findViewById(R.id.tv_price_range)
        val tvBadge: TextView = view.findViewById(R.id.tv_brand_badge)
        val rvTimes: RecyclerView = view.findViewById(R.id.rv_show_times)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_cinema_schedule, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val cinema = items[position]
        holder.tvName.text = cinema.cinemaName
        holder.tvType.text = cinema.studioType
        holder.tvPrice.text = cinema.priceRange
        holder.tvBadge.text = when (cinema.brand) {
            CinemaBrand.XXI -> "XXI"
            CinemaBrand.CGV -> "CGV"
            CinemaBrand.CINEPOLIS -> "CINEPOLIS"
            CinemaBrand.OTHER -> ""
        }

        holder.rvTimes.layoutManager =
            LinearLayoutManager(holder.itemView.context, LinearLayoutManager.HORIZONTAL, false)
        holder.rvTimes.adapter = ShowTimeAdapter(cinema.showTimes) { time ->
            onTimeClick(cinema, time)
        }
    }

    override fun getItemCount() = items.size

    fun updateList(newList: List<CinemaSchedule>) {
        items = newList
        notifyDataSetChanged()
    }
}
