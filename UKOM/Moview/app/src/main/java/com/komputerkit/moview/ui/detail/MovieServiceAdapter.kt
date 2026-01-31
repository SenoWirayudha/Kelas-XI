package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.api.StreamingServiceDto
import com.komputerkit.moview.data.api.TheatricalServiceDto
import com.komputerkit.moview.util.loadLogo
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MovieServiceAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val items = mutableListOf<ServiceItem>()
    
    sealed class ServiceItem {
        data class Streaming(val service: StreamingServiceDto) : ServiceItem()
        data class Theatrical(val service: TheatricalServiceDto) : ServiceItem()
    }
    
    companion object {
        private const val TYPE_STREAMING = 0
        private const val TYPE_THEATRICAL = 1
    }
    
    fun submitStreamingServices(services: List<StreamingServiceDto>) {
        items.clear()
        items.addAll(services.map { ServiceItem.Streaming(it) })
        notifyDataSetChanged()
    }
    
    fun submitTheatricalServices(services: List<TheatricalServiceDto>) {
        items.clear()
        items.addAll(services.map { ServiceItem.Theatrical(it) })
        notifyDataSetChanged()
    }
    
    override fun getItemViewType(position: Int): Int {
        return when (items[position]) {
            is ServiceItem.Streaming -> TYPE_STREAMING
            is ServiceItem.Theatrical -> TYPE_THEATRICAL
        }
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_STREAMING -> {
                val view = inflater.inflate(R.layout.item_streaming_service, parent, false)
                StreamingViewHolder(view)
            }
            TYPE_THEATRICAL -> {
                val view = inflater.inflate(R.layout.item_theatrical_service, parent, false)
                TheatricalViewHolder(view)
            }
            else -> throw IllegalArgumentException("Unknown view type")
        }
    }
    
    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is ServiceItem.Streaming -> (holder as StreamingViewHolder).bind(item.service)
            is ServiceItem.Theatrical -> (holder as TheatricalViewHolder).bind(item.service)
        }
    }
    
    override fun getItemCount() = items.size
    
    class StreamingViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ivLogo: ImageView = itemView.findViewById(R.id.iv_service_logo)
        private val tvServiceName: TextView = itemView.findViewById(R.id.tv_service_name)
        private val tvAvailabilityType: TextView = itemView.findViewById(R.id.tv_availability_type)
        private val badgeAvailability: View = itemView.findViewById(R.id.badge_availability)
        private val tvDate: TextView? = itemView.findViewById(R.id.tv_release_date)
        
        fun bind(service: StreamingServiceDto) {
            // Set service name
            tvServiceName.text = service.name
            
            // Set availability type badge
            tvAvailabilityType.text = when (service.availability_type.lowercase()) {
                "stream" -> "STREAM"
                "rent" -> "RENT"
                "buy" -> "BUY"
                else -> service.availability_type.uppercase()
            }
            
            // Set badge color based on type
            val badgeColor = when (service.availability_type.lowercase()) {
                "stream" -> itemView.context.getColor(android.R.color.holo_green_dark)
                "rent" -> itemView.context.getColor(android.R.color.holo_orange_dark)
                "buy" -> itemView.context.getColor(android.R.color.holo_blue_dark)
                else -> itemView.context.getColor(android.R.color.darker_gray)
            }
            (badgeAvailability as? com.google.android.material.card.MaterialCardView)?.setCardBackgroundColor(badgeColor)
            
            if (service.logo_url != null) {
                ivLogo.loadLogo(service.logo_url)
            } else {
                // Use a default background for services without logos
                ivLogo.setBackgroundColor(itemView.context.getColor(android.R.color.darker_gray))
            }
            
            // Show release date if available and in the future
            if (service.release_date != null && tvDate != null) {
                tvDate.visibility = View.VISIBLE
                tvDate.text = formatDate(service.release_date)
            } else if (tvDate != null) {
                tvDate.visibility = View.GONE
            }
        }
        
        private fun formatDate(dateString: String): String {
            return try {
                val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val date = parser.parse(dateString)
                val formatter = SimpleDateFormat("MMM dd", Locale.getDefault())
                date?.let { formatter.format(it) } ?: dateString
            } catch (e: Exception) {
                dateString
            }
        }
    }
    
    class TheatricalViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ivLogo: ImageView = itemView.findViewById(R.id.iv_theater_logo)
        private val tvServiceName: TextView = itemView.findViewById(R.id.tv_service_name)
        private val tvStatusBadge: TextView = itemView.findViewById(R.id.tv_status_badge)
        private val badgeStatus: View = itemView.findViewById(R.id.badge_status)
        private val tvDate: TextView = itemView.findViewById(R.id.tv_theater_date)
        
        fun bind(service: TheatricalServiceDto) {
            // Set service name
            tvServiceName.text = service.name
            
            // Load logo
            if (service.logo_url != null) {
                ivLogo.loadLogo(service.logo_url)
            } else {
                // Use a default background for services without logos
                ivLogo.setBackgroundColor(itemView.context.getColor(android.R.color.darker_gray))
            }
            
            // Determine if upcoming or now showing based on release date
            val isUpcoming = service.release_date?.let { dateString ->
                try {
                    val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                    val releaseDate = parser.parse(dateString)
                    val now = Date()
                    releaseDate?.after(now) == true
                } catch (e: Exception) {
                    false
                }
            } ?: false
            
            // Set badge text and color
            if (isUpcoming) {
                tvStatusBadge.text = "UPCOMING"
                (badgeStatus as? com.google.android.material.card.MaterialCardView)?.setCardBackgroundColor(
                    itemView.context.getColor(android.R.color.holo_blue_dark)
                )
            } else {
                tvStatusBadge.text = "NOW"
                (badgeStatus as? com.google.android.material.card.MaterialCardView)?.setCardBackgroundColor(
                    itemView.context.getColor(android.R.color.holo_orange_dark)
                )
            }
            
            // Show release date if available and upcoming
            if (service.release_date != null && isUpcoming) {
                tvDate.visibility = View.VISIBLE
                tvDate.text = formatDate(service.release_date)
            } else {
                tvDate.visibility = View.GONE
            }
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
