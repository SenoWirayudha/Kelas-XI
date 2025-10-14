package com.komputerkit.wavesoffood.ui.orders

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.ItemOrderBinding
import com.komputerkit.wavesoffood.model.Order
import java.text.SimpleDateFormat
import java.util.*

class OrdersAdapter(
    private val onItemClick: (Order) -> Unit
) : ListAdapter<Order, OrdersAdapter.OrderViewHolder>(OrderDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val binding = ItemOrderBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return OrderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class OrderViewHolder(
        private val binding: ItemOrderBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(order: Order) {
            binding.apply {
                tvOrderId.text = "Order #${order.id.take(8)}"
                tvOrderDate.text = order.createdAt?.toDate()?.let { date ->
                    SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
                } ?: "Unknown date"
                
                val statusText = order.status.name
                tvOrderStatus.text = statusText
                tvOrderTotal.text = root.context.getString(R.string.currency, order.total.toString())
                tvItemCount.text = "${order.items.size} item(s)"
                
                // Set status color based on order status
                when (statusText.uppercase()) {
                    "PENDING" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_orange_dark))
                    "CONFIRMED" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_blue_dark))
                    "PREPARING" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_blue_dark))
                    "READY" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_purple))
                    "OUT_FOR_DELIVERY" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_purple))
                    "DELIVERED" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_green_dark))
                    "CANCELLED" -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.holo_red_dark))
                    else -> tvOrderStatus.setTextColor(root.context.getColor(android.R.color.darker_gray))
                }

                root.setOnClickListener { onItemClick(order) }
            }
        }
    }

    private class OrderDiffCallback : DiffUtil.ItemCallback<Order>() {
        override fun areItemsTheSame(oldItem: Order, newItem: Order): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Order, newItem: Order): Boolean {
            return oldItem == newItem
        }
    }
}
