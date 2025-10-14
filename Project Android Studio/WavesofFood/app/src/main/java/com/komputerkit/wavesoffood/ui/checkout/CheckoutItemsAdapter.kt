package com.komputerkit.wavesoffood.ui.checkout

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.ItemCheckoutBinding
import com.komputerkit.wavesoffood.model.CartItem
import java.text.NumberFormat
import java.util.*

class CheckoutItemsAdapter : ListAdapter<CartItem, CheckoutItemsAdapter.CheckoutItemViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CheckoutItemViewHolder {
        val binding = ItemCheckoutBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return CheckoutItemViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CheckoutItemViewHolder, position: Int) {
        val item = getItem(position)
        android.util.Log.d("CheckoutItemsAdapter", "Binding item at position $position: ${item.name}")
        holder.bind(item)
    }

    class CheckoutItemViewHolder(
        private val binding: ItemCheckoutBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("id", "ID"))

        fun bind(cartItem: CartItem) {
            binding.apply {
                tvFoodName.text = cartItem.name
                tvFoodPrice.text = currencyFormat.format(cartItem.price)
                tvQuantity.text = "x${cartItem.quantity}"
                tvTotalPrice.text = currencyFormat.format(cartItem.totalPrice)
                
                // For now, we'll use a placeholder image
                // You can add image loading logic here if you have image URLs
                ivFoodImage.setImageResource(R.drawable.ic_food_placeholder)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<CartItem>() {
        override fun areItemsTheSame(oldItem: CartItem, newItem: CartItem): Boolean {
            return oldItem.foodId == newItem.foodId
        }

        override fun areContentsTheSame(oldItem: CartItem, newItem: CartItem): Boolean {
            return oldItem == newItem
        }
    }
}
