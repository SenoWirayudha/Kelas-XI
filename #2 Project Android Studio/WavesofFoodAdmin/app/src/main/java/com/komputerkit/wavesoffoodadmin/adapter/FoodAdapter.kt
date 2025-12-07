package com.komputerkit.wavesoffoodadmin.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.PopupMenu
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.wavesoffoodadmin.R
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.databinding.ItemFoodBinding
import com.komputerkit.wavesoffoodadmin.model.MenuItem

class FoodAdapter(
    private val foods: List<MenuItem>,
    private val onItemAction: (MenuItem, String) -> Unit
) : RecyclerView.Adapter<FoodAdapter.FoodViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FoodViewHolder {
        val binding = ItemFoodBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return FoodViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FoodViewHolder, position: Int) {
        holder.bind(foods[position])
    }

    override fun getItemCount(): Int = foods.size

    inner class FoodViewHolder(private val binding: ItemFoodBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(food: MenuItem) {
            binding.apply {
                tvFoodName.text = food.name
                tvFoodCategory.text = food.category
                tvFoodDescription.text = food.description
                tvFoodPrice.text = Utils.formatPrice(food.price)
                tvFoodRating.text = "★ ${food.rating}"
                
                // Load image with Glide
                Glide.with(itemView.context)
                    .load(food.imageUrl)
                    .placeholder(R.drawable.ic_launcher_foreground)
                    .error(R.drawable.ic_launcher_foreground)
                    .into(ivFoodImage)
                
                // Set availability switch
                switchAvailable.setOnCheckedChangeListener(null) // Clear previous listener
                switchAvailable.isChecked = food.isAvailable
                
                // Update switch text based on availability
                switchAvailable.text = if (food.isAvailable) "Tersedia" else "Tidak Tersedia"
                
                // Set new listener
                switchAvailable.setOnCheckedChangeListener { _, isChecked ->
                    android.util.Log.d("FoodAdapter", "Switch toggled for ${food.name}: $isChecked (was ${food.isAvailable})")
                    
                    // Update text immediately for better UX
                    switchAvailable.text = if (isChecked) "Tersedia" else "Tidak Tersedia"
                    
                    onItemAction(food, "toggle_availability")
                }
                
                // Setup menu actions
                ivMenuActions.setOnClickListener { view ->
                    val popup = PopupMenu(itemView.context, view)
                    popup.menuInflater.inflate(R.menu.food_item_menu, popup.menu)
                    
                    popup.setOnMenuItemClickListener { item ->
                        when (item.itemId) {
                            R.id.action_edit -> {
                                onItemAction(food, "edit")
                                true
                            }
                            R.id.action_delete -> {
                                onItemAction(food, "delete")
                                true
                            }
                            else -> false
                        }
                    }
                    
                    popup.show()
                }
            }
        }
    }
}
