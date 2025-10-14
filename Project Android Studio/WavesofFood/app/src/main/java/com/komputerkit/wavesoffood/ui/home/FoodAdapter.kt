package com.komputerkit.wavesoffood.ui.home

import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.model.Food
import com.komputerkit.wavesoffood.databinding.ItemFoodBinding

class FoodAdapter(
    private val onItemClick: (Food) -> Unit,
    private val onAddToCartClick: (Food) -> Unit
) : ListAdapter<Food, FoodAdapter.FoodViewHolder>(FoodDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FoodViewHolder {
        val binding = ItemFoodBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FoodViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FoodViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class FoodViewHolder(
        private val binding: ItemFoodBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(food: Food) {
            Log.d("FoodAdapter", "Binding food: ${food.name}, isAvailable: ${food.isAvailable}")
            
            binding.apply {
                tvName.text = food.name
                tvPrice.text = root.context.getString(R.string.currency, food.price.toString())
                ratingBar.rating = food.rating
                
                // Display review count
                tvReviewCount.text = if (food.reviewCount > 0) {
                    "(${food.reviewCount} reviews)"
                } else {
                    "(0 reviews)"
                }
                
                // Load image first
                Glide.with(root.context)
                    .load(food.imageUrl)
                    .centerCrop()
                    .into(ivFood)
                
                if (food.isAvailable) {
                    // Menu tersedia - tampilan normal
                    Log.d("FoodAdapter", "${food.name} is available - setting normal view")
                    ivFood.alpha = 1.0f
                    ivFood.colorFilter = null
                    btnAddToCart.isEnabled = true
                    btnAddToCart.text = "Add to Cart"
                    btnAddToCart.alpha = 1.0f
                    root.isEnabled = true
                    root.alpha = 1.0f
                    
                    root.setOnClickListener { onItemClick(food) }
                    btnAddToCart.setOnClickListener { onAddToCartClick(food) }
                } else {
                    // Menu tidak tersedia - tampilan disabled
                    Log.d("FoodAdapter", "${food.name} is NOT available - setting disabled view")
                    ivFood.alpha = 0.5f
                    
                    // Buat efek grayscale pada gambar
                    val matrix = ColorMatrix()
                    matrix.setSaturation(0f)
                    val filter = ColorMatrixColorFilter(matrix)
                    ivFood.colorFilter = filter
                    
                    btnAddToCart.isEnabled = false
                    btnAddToCart.text = "Menu Tidak Tersedia"
                    btnAddToCart.alpha = 0.6f
                    root.isEnabled = false
                    root.alpha = 0.7f
                    
                    // Hapus click listeners
                    root.setOnClickListener(null)
                    btnAddToCart.setOnClickListener(null)
                }
            }
        }
    }

    private class FoodDiffCallback : DiffUtil.ItemCallback<Food>() {
        override fun areItemsTheSame(oldItem: Food, newItem: Food): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Food, newItem: Food): Boolean {
            return oldItem == newItem
        }
    }
}
