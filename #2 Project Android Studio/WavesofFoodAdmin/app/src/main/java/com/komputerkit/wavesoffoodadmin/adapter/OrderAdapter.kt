package com.komputerkit.wavesoffoodadmin.adapter

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.databinding.ItemOrderBinding
import com.komputerkit.wavesoffoodadmin.model.Order

class OrderAdapter(
    private val orders: List<Order>,
    private val onItemAction: (Order, String) -> Unit
) : RecyclerView.Adapter<OrderAdapter.OrderViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val binding = ItemOrderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return OrderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
        holder.bind(orders[position])
    }

    override fun getItemCount(): Int = orders.size

    inner class OrderViewHolder(private val binding: ItemOrderBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(order: Order) {
            binding.apply {
                tvOrderId.text = "Order #${order.id.take(8)}"
                tvCustomerName.text = order.recipientName
                tvOrderTotal.text = Utils.formatPrice(order.total)
                tvOrderStatus.text = Utils.getOrderStatusText(order.status)
                
                // Format order time
                order.createdAt?.let { timestamp ->
                    tvOrderTime.text = Utils.formatTimeOnly(timestamp.toDate().time)
                }
                
                // Items summary
                val orderItems = order.getOrderItems()
                val itemCount = orderItems.size
                val totalQuantity = orderItems.sumOf { it.quantity }
                tvItemsSummary.text = "$itemCount item${if (itemCount > 1) "s" else ""} ($totalQuantity total)"
                
                // Status color
                val statusColor = Utils.getOrderStatusColor(order.status)
                tvOrderStatus.setBackgroundColor(itemView.context.getColor(statusColor))
                
                // Button actions
                btnViewDetails.setOnClickListener {
                    onItemAction(order, "view_details")
                }
                
                btnUpdateStatus.setOnClickListener {
                    onItemAction(order, "update_status")
                }
                
                // Hide update button for delivered orders
                if (order.status == "DELIVERED") {
                    btnUpdateStatus.text = "Selesai"
                    btnUpdateStatus.isEnabled = false
                } else {
                    btnUpdateStatus.text = getNextStatusText(order.status)
                    btnUpdateStatus.isEnabled = true
                }
            }
        }
        
        private fun getNextStatusText(currentStatus: String): String {
            return when (currentStatus) {
                "PENDING" -> "Konfirmasi"
                "CONFIRMED" -> "Proses"
                "PREPARING" -> "Siap"
                "READY" -> "Kirim"
                else -> "Update"
            }
        }
    }
}
