package com.komputerkit.moview.ui.cinema.adapter

import android.content.Context
import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.CinemaBrand
import com.komputerkit.moview.ui.cinema.model.CinemaSchedule
import com.komputerkit.moview.ui.cinema.model.ShowTime

class CinemaScheduleAdapter(
    items: List<CinemaSchedule>,
    private val onTimeClick: (cinema: CinemaSchedule, time: ShowTime) -> Unit
) : RecyclerView.Adapter<CinemaScheduleAdapter.ViewHolder>() {

    // One card per cinema: each card holds the per-studio sections of that cinema.
    private var cards: List<List<CinemaSchedule>> = emptyList()

    init {
        updateList(items)
    }

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(R.id.tv_cinema_name)
        val tvBadge: TextView = view.findViewById(R.id.tv_brand_badge)
        val sectionsContainer: LinearLayout = view.findViewById(R.id.sections_container)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_cinema_schedule, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val sections = cards[position]
        val cinema = sections.first()
        val context = holder.itemView.context

        holder.tvName.text = cinema.cinemaName
        val badgeColor = when (cinema.brand) {
            CinemaBrand.XXI -> context.getColor(R.color.brand_xxi)
            CinemaBrand.CGV -> context.getColor(R.color.brand_cgv)
            CinemaBrand.CINEPOLIS -> context.getColor(R.color.brand_cinepolis)
            CinemaBrand.OTHER -> null
        }
        holder.tvBadge.text = when (cinema.brand) {
            CinemaBrand.XXI -> "XXI"
            CinemaBrand.CGV -> "CGV"
            CinemaBrand.CINEPOLIS -> "CINEPOLIS"
            CinemaBrand.OTHER -> ""
        }
        if (badgeColor == null) {
            holder.tvBadge.visibility = View.GONE
        } else {
            holder.tvBadge.visibility = View.VISIBLE
            holder.tvBadge.backgroundTintList = ColorStateList.valueOf(badgeColor)
        }

        holder.sectionsContainer.removeAllViews()
        sections.forEachIndexed { index, section ->
            val sectionView = LayoutInflater.from(context)
                .inflate(R.layout.item_studio_section, holder.sectionsContainer, false)

            sectionView.findViewById<TextView>(R.id.tv_section_studio_type).text =
                section.studioType
            sectionView.findViewById<TextView>(R.id.tv_section_price).text = section.priceRange

            val rvTimes = sectionView.findViewById<RecyclerView>(R.id.rv_section_times)
            rvTimes.layoutManager =
                LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
            rvTimes.adapter = ShowTimeAdapter(section.showTimes) { time ->
                onTimeClick(section, time)
            }

            val lp = sectionView.layoutParams as LinearLayout.LayoutParams
            lp.topMargin = dpToPx(context, if (index == 0) 0 else 16)
            sectionView.layoutParams = lp

            holder.sectionsContainer.addView(sectionView)
        }
    }

    override fun getItemCount() = cards.size

    fun updateList(newList: List<CinemaSchedule>) {
        // Input is sorted by (cinemaName, studioType); groupBy keeps encounter order.
        cards = newList.groupBy { it.cinemaName }.values.toList()
        notifyDataSetChanged()
    }

    private fun dpToPx(context: Context, dp: Int): Int =
        (dp * context.resources.displayMetrics.density + 0.5f).toInt()
}
