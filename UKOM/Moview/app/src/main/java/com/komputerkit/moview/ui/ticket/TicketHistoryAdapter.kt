package com.komputerkit.moview.ui.ticket

import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ItemTicketHistoryBinding

data class TicketHistoryItem(
    val posterUrl: String,
    val title: String,
    val cinemaName: String,
    val studioInfo: String,
    val showDate: String,
    val showTime: String,
    val seatInfo: String,
    val status: TicketStatus
)

enum class TicketStatus { PAID, EXPIRED }

class TicketHistoryAdapter(
    private val onPrimaryActionClick: (TicketHistoryItem) -> Unit
) : RecyclerView.Adapter<TicketHistoryAdapter.TicketHistoryViewHolder>() {

    private val items = mutableListOf<TicketHistoryItem>()

    fun submitList(data: List<TicketHistoryItem>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TicketHistoryViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val binding = ItemTicketHistoryBinding.inflate(inflater, parent, false)
        return TicketHistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TicketHistoryViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class TicketHistoryViewHolder(
        private val binding: ItemTicketHistoryBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: TicketHistoryItem) {
            val context = binding.root.context

            binding.tvTitle.text = item.title
            binding.tvCinema.text = item.cinemaName
            binding.tvStudioInfo.text = item.studioInfo
            binding.tvDate.text = "${item.showDate} • ${item.showTime}"
            binding.tvSeat.text = item.seatInfo

            if (item.posterUrl.isBlank()) {
                binding.ivPoster.setImageResource(R.drawable.ic_movie)
            } else {
                Glide.with(context)
                    .load(item.posterUrl)
                    .placeholder(R.drawable.ic_movie)
                    .error(R.drawable.ic_movie)
                    .into(binding.ivPoster)
            }

            when (item.status) {
                TicketStatus.PAID -> {
                    binding.tvStatus.text = "PAID"
                    binding.tvStatus.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.star_green)
                    )

                    binding.btnPrimary.text = "LIHAT QR TIKET"
                    binding.btnPrimary.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.accent_blue)
                    )
                    binding.btnPrimary.setTextColor(ContextCompat.getColor(context, android.R.color.white))
                    binding.btnPrimary.icon = ContextCompat.getDrawable(context, R.drawable.ic_ticket)
                }

                TicketStatus.EXPIRED -> {
                    binding.tvStatus.text = "EXPIRED"
                    binding.tvStatus.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.text_secondary)
                    )

                    binding.btnPrimary.text = "LIHAT DETAIL"
                    binding.btnPrimary.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.dark_surface)
                    )
                    binding.btnPrimary.setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                    binding.btnPrimary.icon = null
                }
            }

            binding.btnPrimary.setOnClickListener { onPrimaryActionClick(item) }
        }
    }
}
