package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.api.StreamingServiceDto
import com.komputerkit.moview.databinding.ItemServiceAvailabilityBinding
import com.komputerkit.moview.util.StreamingAvailabilityUtils
import com.komputerkit.moview.util.loadLogo
import java.text.SimpleDateFormat
import java.util.Locale

class StreamingAvailabilityAdapter(
    private val onItemClick: ((StreamingServiceDto) -> Unit)? = null
) : RecyclerView.Adapter<StreamingAvailabilityAdapter.ViewHolder>() {

    private var items: List<StreamingServiceDto> = emptyList()
    private var selectedCountry: String? = null

    fun submitList(services: List<StreamingServiceDto>, countryName: String? = null) {
        items = services
        selectedCountry = countryName
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemServiceAvailabilityBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemServiceAvailabilityBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(service: StreamingServiceDto) {
            val context = binding.root.context
            binding.tvServiceName.text = service.name

            val rows = StreamingAvailabilityUtils.rowsFor(service, selectedCountry)

            if (!service.logo_url.isNullOrEmpty()) {
                binding.ivServiceLogo.loadLogo(service.logo_url)
            }

            // Availability rows: country · type · status · date
            val inflater = LayoutInflater.from(context)
            binding.llRows.removeAllViews()
            rows.forEach { row ->
                val rowView = inflater.inflate(R.layout.item_availability_row, binding.llRows, false)
                bindRow(rowView, row)
                binding.llRows.addView(rowView)
            }

            binding.root.setOnClickListener { onItemClick?.invoke(service) }
        }

        private fun bindRow(rowView: View, row: StreamingAvailabilityUtils.AvailabilityRow) {
            val context = rowView.context
            val flagView = rowView.findViewById<ImageView>(R.id.iv_row_flag)
            val countryView = rowView.findViewById<TextView>(R.id.tv_row_country)
            val metaView = rowView.findViewById<TextView>(R.id.tv_row_meta)

            // Country flag (reuses the bundled flag_*.png resources)
            val flagRes = row.countryCode?.lowercase(Locale.ENGLISH)?.let { code ->
                context.resources.getIdentifier("flag_$code", "drawable", context.packageName)
            }
            if (flagRes != null && flagRes != 0) {
                com.bumptech.glide.Glide.with(flagView.context)
                    .load(flagRes)
                    .apply(
                        com.bumptech.glide.request.RequestOptions()
                            .placeholder(0)
                            .error(0)
                            .circleCrop()
                    )
                    .into(flagView)
            } else {
                flagView.setImageResource(R.drawable.ic_globe_flag)
            }

            countryView.text = row.countryName

            val type = row.type.uppercase(Locale.ROOT)
            val status = if (row.isComingSoon) "Coming Soon" else "Available"
            val date = row.date?.let { formatDate(it) }
            metaView.text = listOfNotNull(type, status, date).joinToString(" · ")
        }

        private fun formatDate(dateString: String): String {
            return try {
                val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val date = parser.parse(dateString)
                val formatter = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                date?.let { formatter.format(it) } ?: dateString
            } catch (e: Exception) {
                dateString
            }
        }
    }
}
