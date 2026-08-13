package com.komputerkit.moview.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import androidx.core.content.ContextCompat
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.LikedReview
import com.komputerkit.moview.databinding.ItemLikedReviewBinding
import com.komputerkit.moview.util.loadProfilePhoto

class LikedReviewAdapter(
    private val onReviewClick: (Int) -> Unit
) : RecyclerView.Adapter<LikedReviewAdapter.LikedReviewViewHolder>() {
    
    private var reviews: List<LikedReview> = emptyList()
    
    fun submitList(list: List<LikedReview>) {
        reviews = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LikedReviewViewHolder {
        val binding = ItemLikedReviewBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return LikedReviewViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: LikedReviewViewHolder, position: Int) {
        holder.bind(reviews[position])
    }
    
    override fun getItemCount(): Int = reviews.size
    
    inner class LikedReviewViewHolder(
        private val binding: ItemLikedReviewBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(review: LikedReview) {
            // Load profile photo
            binding.ivProfile.loadProfilePhoto(review.profilePhoto)
            
            // Set rating stars
            binding.starRating.apply {
                starSizeDp = 12f
                starGapDp = 1f
                displayMode = true
                setColors(
                    ContextCompat.getColor(context, R.color.star_green),
                    ContextCompat.getColor(context, R.color.star_green_empty)
                )
                rating = review.rating
            }
            
            // Click listener to navigate to review detail
            binding.root.setOnClickListener {
                onReviewClick(review.reviewId)
            }
        }
    }
}
