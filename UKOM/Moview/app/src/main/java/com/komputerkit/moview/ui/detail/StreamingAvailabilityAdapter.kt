package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.komputerkit.moview.R
import com.komputerkit.moview.data.api.StreamingServiceDto
import com.komputerkit.moview.databinding.ItemServiceAvailabilityBinding
import com.komputerkit.moview.util.loadLogo

class StreamingAvailabilityAdapter(
    private val onItemClick: ((StreamingServiceDto) -> Unit)? = null
) : RecyclerView.Adapter<StreamingAvailabilityAdapter.ViewHolder>() {

    private var items: List<StreamingServiceDto> = emptyList()

    fun submitList(services: List<StreamingServiceDto>) {
        items = services
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

            // Availability badge (same mapping as the detail preview)
            if (service.is_coming_soon) {
                binding.tvAvailabilityType.text = "COMING SOON"
                binding.badgeAvailability.setCardBackgroundColor(
                    context.getColor(android.R.color.holo_purple)
                )
            } else {
                binding.tvAvailabilityType.text = when (service.availability_type.lowercase()) {
                    "stream" -> "STREAM"
                    "rent" -> "RENT"
                    "buy" -> "BUY"
                    else -> service.availability_type.uppercase()
                }
                binding.badgeAvailability.setCardBackgroundColor(
                    when (service.availability_type.lowercase()) {
                        "stream" -> context.getColor(android.R.color.holo_green_dark)
                        "rent" -> context.getColor(android.R.color.holo_orange_dark)
                        "buy" -> context.getColor(android.R.color.holo_blue_dark)
                        else -> context.getColor(android.R.color.darker_gray)
                    }
                )
            }

            if (!service.logo_url.isNullOrEmpty()) {
                binding.ivServiceLogo.loadLogo(service.logo_url)
            }

            // Release date
            if (!service.release_date.isNullOrBlank()) {
                binding.tvReleaseDate.visibility = View.VISIBLE
                binding.tvReleaseDate.text = service.release_date
            } else {
                binding.tvReleaseDate.visibility = View.GONE
            }

            // Country availability chips
            val countries = service.countries.orEmpty()
            binding.chipGroupCountries.removeAllViews()
            if (countries.isEmpty()) {
                binding.tvAllCountries.visibility = View.VISIBLE
                binding.chipGroupCountries.visibility = View.GONE
            } else {
                binding.tvAllCountries.visibility = View.GONE
                binding.chipGroupCountries.visibility = View.VISIBLE
                countries.forEach { country ->
                    val chip = Chip(context)
                    chip.text = country.name ?: country.code ?: "?"
                    chip.isClickable = false
                    chip.isFocusable = false
                    chip.chipStrokeWidth = 0f
                    chip.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
                        context.getColor(R.color.dark_card)
                    )
                    chip.setTextColor(context.getColor(R.color.white))
                    chip.textSize = 11f
                    binding.chipGroupCountries.addView(chip)
                }
            }

            binding.root.setOnClickListener { onItemClick?.invoke(service) }
        }
    }
}
