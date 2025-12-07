package com.komputerkit.wavesoffood.ui.orders

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.wavesoffood.databinding.ItemOrderRatingBinding
import com.komputerkit.wavesoffood.model.OrderItem
import java.text.NumberFormat
import java.util.*

class OrderItemsRatingAdapter(
    private val onRatingSubmitted: (OrderItem, Float, String) -> Unit
) : ListAdapter<OrderItem, OrderItemsRatingAdapter.OrderItemRatingViewHolder>(OrderItemRatingDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderItemRatingViewHolder {
        val binding = ItemOrderRatingBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return OrderItemRatingViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderItemRatingViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class OrderItemRatingViewHolder(
        private val binding: ItemOrderRatingBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(orderItem: OrderItem) {
            binding.apply {
                // Item details
                tvItemName.text = orderItem.name
                tvItemPrice.text = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
                    .format(orderItem.totalPrice)
                tvItemQuantity.text = "Qty: ${orderItem.quantity}"

                if (orderItem.hasRated) {
                    // Show rated state
                    ratingSection.visibility = android.view.View.GONE
                    ratedSection.visibility = android.view.View.VISIBLE
                    
                    ratingBarDisplay.rating = orderItem.rating
                    tvRatingDisplay.text = "${orderItem.rating.toInt()}/5"
                    
                    if (orderItem.review.isNotEmpty()) {
                        tvReviewDisplay.text = "\"${orderItem.review}\""
                        tvReviewDisplay.visibility = android.view.View.VISIBLE
                    } else {
                        tvReviewDisplay.visibility = android.view.View.GONE
                    }
                } else {
                    // Show rating input
                    ratingSection.visibility = android.view.View.VISIBLE
                    ratedSection.visibility = android.view.View.GONE
                    
                    ratingBar.rating = 0f
                    tvRatingValue.text = "0/5"
                    etReview.setText("")
                    
                    // Rating bar listener
                    ratingBar.setOnRatingBarChangeListener { _, rating, _ ->
                        tvRatingValue.text = "${rating.toInt()}/5"
                    }
                    
                    // Submit button
                    btnSubmitItemRating.setOnClickListener {
                        val rating = ratingBar.rating
                        val review = etReview.text?.toString()?.trim() ?: ""
                        
                        if (rating > 0) {
                            onRatingSubmitted(orderItem, rating, review)
                        } else {
                            android.widget.Toast.makeText(
                                root.context,
                                "Please select a rating for ${orderItem.name}",
                                android.widget.Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                }
            }
        }
    }

    private class OrderItemRatingDiffCallback : DiffUtil.ItemCallback<OrderItem>() {
        override fun areItemsTheSame(oldItem: OrderItem, newItem: OrderItem): Boolean {
            return oldItem.id == newItem.id  // Use unique OrderItem ID instead of foodId
        }

        override fun areContentsTheSame(oldItem: OrderItem, newItem: OrderItem): Boolean {
            return oldItem == newItem
        }
    }
}
