package com.komputerkit.moview.ui.event

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.EventItem
import com.komputerkit.moview.databinding.ItemEventCardBinding
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/** Event cards for the "Event Festival" section on the Bioskop tab. */
class EventCardAdapter(
    private val onClick: (EventItem) -> Unit
) : ListAdapter<EventItem, EventCardAdapter.EventViewHolder>(Diff()) {

    /** Tallest content block seen so far, so every card in the row shares one height. */
    private var maxContentHeight = 0
    private var rebindPending = false

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EventViewHolder {
        val binding = ItemEventCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return EventViewHolder(
            binding = binding,
            onClick = onClick,
            contentHeight = { maxContentHeight },
            reportContentHeight = { natural ->
                if (natural > maxContentHeight) {
                    maxContentHeight = natural
                    scheduleRebind(binding)
                }
            }
        )
    }

    /** One extra layout pass after a taller card is discovered; then the max is stable. */
    private fun scheduleRebind(binding: ItemEventCardBinding) {
        if (rebindPending) return
        rebindPending = true
        binding.root.post {
            rebindPending = false
            notifyItemRangeChanged(0, itemCount)
        }
    }

    override fun onBindViewHolder(holder: EventViewHolder, position: Int) {
        holder.bind(getItem(position), itemCount)
    }

    class EventViewHolder(
        private val binding: ItemEventCardBinding,
        private val onClick: (EventItem) -> Unit,
        private val contentHeight: () -> Int,
        private val reportContentHeight: (Int) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(event: EventItem, totalEvents: Int) {
            val context = binding.root.context
            val screenWidth = context.resources.displayMetrics.widthPixels
            val density = context.resources.displayMetrics.density
            // Single event fills the row; several events show ~85% so the next one peeks.
            val width = if (totalEvents > 1) {
                (screenWidth * 0.85f).toInt()
            } else {
                screenWidth - (32 * density).toInt()
            }

            binding.tvTitle.text = event.title
            binding.tvDates.text = "${formatDate(event.startDate)} - ${formatDate(event.endDate)}"
            binding.tvCinema.text = event.cinemaName.orEmpty()

            val saleNotice = if (event.salesOpen) null else formatSaleStart(event.saleStartsAt)
            if (saleNotice != null) {
                // Sales not open yet: the price row becomes an opening notice.
                binding.tvPriceLabel.visibility = android.view.View.GONE
                binding.tvPrice.visibility = android.view.View.GONE
                binding.tvSaleNotice.visibility = android.view.View.VISIBLE
                binding.tvSaleNotice.text = saleNotice
            } else {
                binding.tvPriceLabel.visibility = android.view.View.VISIBLE
                binding.tvPrice.visibility = android.view.View.VISIBLE
                binding.tvSaleNotice.visibility = android.view.View.GONE
                binding.tvPrice.text = event.startPrice?.let { "Rp. ${formatPrice(it)}" } ?: "-"
            }

            Glide.with(context)
                .load(event.bannerUrl)
                .centerCrop()
                .into(binding.ivBanner)

            // Natural content height for this card, then the shared (tallest) height.
            binding.layoutContent.measure(
                android.view.View.MeasureSpec.makeMeasureSpec(width, android.view.View.MeasureSpec.EXACTLY),
                android.view.View.MeasureSpec.makeMeasureSpec(0, android.view.View.MeasureSpec.UNSPECIFIED)
            )
            reportContentHeight(binding.layoutContent.measuredHeight)

            val bannerHeight = (width / BANNER_RATIO).toInt()
            binding.root.layoutParams = binding.root.layoutParams.apply {
                this.width = width
                height = bannerHeight + contentHeight()
            }

            binding.root.setOnClickListener { onClick(event) }
            binding.btnChevron.setOnClickListener { onClick(event) }
        }
    }

    private class Diff : DiffUtil.ItemCallback<EventItem>() {
        override fun areItemsTheSame(oldItem: EventItem, newItem: EventItem) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: EventItem, newItem: EventItem) = oldItem == newItem
    }

    companion object {
        private const val BANNER_RATIO = 2.4f

        private val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        private val outputFormat = SimpleDateFormat("d MMMM yyyy", Locale("id", "ID"))
        private val saleInputFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        private val saleDateFormat = SimpleDateFormat("d MMMM", Locale("id", "ID"))
        private val saleTimeFormat = SimpleDateFormat("HH.mm", Locale.US)

        private fun formatDate(raw: String): String = try {
            inputFormat.parse(raw)?.let { outputFormat.format(it) } ?: raw
        } catch (_: Exception) {
            raw
        }

        private fun formatPrice(value: Double): String =
            NumberFormat.getNumberInstance(Locale("id", "ID")).format(value)

        /**
         * "Dibuka mulai 8 November jam 00.00" (year added only when it is not this year).
         * The server sends the WIB wall clock, so it is formatted as-is.
         */
        fun formatSaleStart(raw: String?): String? {
            if (raw.isNullOrBlank()) return null
            val date = try {
                saleInputFormat.parse(raw)
            } catch (_: Exception) {
                null
            } ?: return null

            val dateText = saleDateFormat.format(date)
            val thisYear = Calendar.getInstance().get(Calendar.YEAR)
            val year = Calendar.getInstance().apply { time = date }.get(Calendar.YEAR)
            val withYear = if (year != thisYear) "$dateText $year" else dateText

            return "Dibuka mulai $withYear jam ${saleTimeFormat.format(date)}"
        }
    }
}
