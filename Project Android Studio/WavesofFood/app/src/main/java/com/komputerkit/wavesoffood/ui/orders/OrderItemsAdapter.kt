package com.komputerkit.wavesoffood.ui.orders

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.ItemOrderDetailBinding
import com.komputerkit.wavesoffood.model.OrderItem
import java.text.NumberFormat
import java.util.*

class OrderItemsAdapter : ListAdapter<OrderItem, OrderItemsAdapter.OrderItemViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderItemViewHolder {
        val binding = ItemOrderDetailBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return OrderItemViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderItemViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class OrderItemViewHolder(
        private val binding: ItemOrderDetailBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("id", "ID"))

        fun bind(orderItem: OrderItem) {
            binding.apply {
                tvFoodName.text = orderItem.name
                tvFoodPrice.text = currencyFormat.format(orderItem.price)
                tvQuantity.text = "x${orderItem.quantity}"
                tvTotalPrice.text = currencyFormat.format(orderItem.totalPrice)
                
                // You can add food image loading here if you have image URLs
                // For now, we'll use a placeholder
                ivFoodImage.setImageResource(R.drawable.ic_food_placeholder)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<OrderItem>() {
        override fun areItemsTheSame(oldItem: OrderItem, newItem: OrderItem): Boolean {
            return oldItem.foodId == newItem.foodId
        }

        override fun areContentsTheSame(oldItem: OrderItem, newItem: OrderItem): Boolean {
            return oldItem == newItem
        }
    }
}
