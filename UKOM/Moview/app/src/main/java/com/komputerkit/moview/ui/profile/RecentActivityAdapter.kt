package com.komputerkit.moview.ui.profile

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemRecentActivityBinding
import kotlin.math.roundToInt

class RecentActivityAdapter : RecyclerView.Adapter<RecentActivityAdapter.RecentActivityViewHolder>() {
    
    private var activities: List<Pair<Movie, Float>> = emptyList()
    
    fun submitList(list: List<Pair<Movie, Float>>) {
        activities = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecentActivityViewHolder {
        val binding = ItemRecentActivityBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return RecentActivityViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: RecentActivityViewHolder, position: Int) {
        holder.bind(activities[position])
    }
    
    override fun getItemCount(): Int = activities.size
    
    inner class RecentActivityViewHolder(
        private val binding: ItemRecentActivityBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(activity: Pair<Movie, Float>) {
            val (movie, rating) = activity
            
            Glide.with(binding.root.context)
                .load(movie.posterUrl)
                .into(binding.ivPoster)
            
            binding.tvRating.text = getStarsFromRating(rating)
        }
        
        private fun getStarsFromRating(rating: Float): String {
            val fullStars = rating.roundToInt()
            return "★".repeat(fullStars.coerceIn(0, 5))
        }
    }
}
