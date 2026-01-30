package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.databinding.ItemStreamingServiceBinding
import com.komputerkit.moview.util.TmdbImageUrl

class StreamingServiceAdapter(
    private val services: List<String>
) : RecyclerView.Adapter<StreamingServiceAdapter.StreamingViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StreamingViewHolder {
        val binding = ItemStreamingServiceBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return StreamingViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StreamingViewHolder, position: Int) {
        holder.bind(services[position])
    }

    override fun getItemCount() = services.size

    class StreamingViewHolder(
        private val binding: ItemStreamingServiceBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(service: String) {
            // For now just show placeholder
            Glide.with(binding.root.context)
                .load(TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg"))
                .into(binding.ivServiceLogo)
        }
    }
}
