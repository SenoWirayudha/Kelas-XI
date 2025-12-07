package com.komputerkit.wavesoffoodadmin.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.adapter.OrderAdapter
import com.komputerkit.wavesoffoodadmin.databinding.FragmentOrderListBinding
import com.komputerkit.wavesoffoodadmin.model.Order
import com.komputerkit.wavesoffoodadmin.repository.OrderRepository
import kotlinx.coroutines.launch

class OrderListFragment : Fragment() {
    
    private var _binding: FragmentOrderListBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var orderAdapter: OrderAdapter
    private val orderRepository = OrderRepository()
    private val orders = mutableListOf<Order>()
    private var orderStatus: String = ""
    
    companion object {
        private const val ARG_STATUS = "order_status"
        
        fun newInstance(status: String): OrderListFragment {
            return OrderListFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_STATUS, status)
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        orderStatus = arguments?.getString(ARG_STATUS) ?: ""
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOrderListBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        loadOrders()
    }
    
    private fun setupRecyclerView() {
        orderAdapter = OrderAdapter(orders) { order, action ->
            when (action) {
                "view_details" -> viewOrderDetails(order)
                "update_status" -> updateOrderStatus(order)
            }
        }
        
        binding.rvOrders.apply {
            adapter = orderAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun loadOrders() {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                android.util.Log.d("OrderListFragment", "Loading orders with status: $orderStatus")
                
                // Debug: First try to get all orders to see if connection works
                val allOrders = orderRepository.getAllOrders(50)
                android.util.Log.d("OrderListFragment", "Debug - Total orders found: ${allOrders.size}")
                
                allOrders.forEachIndexed { index, order ->
                    android.util.Log.d("OrderListFragment", "Order $index: id=${order.id}, status='${order.status}', recipientName='${order.recipientName}'")
                }
                
                // Now get orders by specific status
                val orderList = orderRepository.getOrdersByStatus(orderStatus)
                android.util.Log.d("OrderListFragment", "Received ${orderList.size} orders for status: $orderStatus")
                
                orders.clear()
                orders.addAll(orderList)
                orderAdapter.notifyDataSetChanged()
                
                showEmpty(orders.isEmpty())
                
            } catch (e: Exception) {
                android.util.Log.e("OrderListFragment", "Error loading orders: ${e.message}")
                Utils.showLongToast(requireContext(), "Gagal memuat pesanan: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }
    
    private fun viewOrderDetails(order: Order) {
        // Show order details dialog or navigate to detail activity
        showOrderDetailsDialog(order)
    }
    
    private fun updateOrderStatus(order: Order) {
        val nextStatus = getNextStatus(order.status)
        if (nextStatus != null) {
            updateStatus(order, nextStatus)
        }
    }
    
    private fun getNextStatus(currentStatus: String): String? {
        return when (currentStatus) {
            "PENDING" -> "PREPARING"
            "PREPARING" -> "READY"
            "READY" -> "DELIVERED"
            else -> null
        }
    }
    
    private fun updateStatus(order: Order, newStatus: String) {
        lifecycleScope.launch {
            try {
                val success = orderRepository.updateOrderStatus(order.id, newStatus)
                if (success) {
                    Utils.showToast(requireContext(), "Status pesanan diperbarui")
                    loadOrders() // Refresh list
                } else {
                    Utils.showToast(requireContext(), "Gagal memperbarui status")
                }
            } catch (e: Exception) {
                Utils.showToast(requireContext(), "Error: ${e.message}")
            }
        }
    }
    
    private fun showOrderDetailsDialog(order: Order) {
        val dialog = androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Detail Pesanan #${order.id.take(8)}")
            .setMessage(buildOrderDetailsText(order))
            .setPositiveButton("Tutup", null)
            .create()
        
        dialog.show()
    }
    
    private fun buildOrderDetailsText(order: Order): String {
        val sb = StringBuilder()
        sb.append("Pemesan: ${order.recipientName}\n")
        sb.append("Telepon: ${order.phone}\n")
        sb.append("Alamat: ${order.deliveryAddress}\n")
        sb.append("Total: ${Utils.formatPrice(order.total)}\n")
        sb.append("Status: ${Utils.getOrderStatusText(order.status)}\n\n")
        
        sb.append("Item Pesanan:\n")
        order.getOrderItems().forEach { item ->
            sb.append("• ${item.name} (${item.quantity}x) - ${Utils.formatPrice(item.price * item.quantity)}\n")
        }
        
        if (order.notes.isNotEmpty()) {
            sb.append("\nCatatan: ${order.notes}")
        }
        
        return sb.toString()
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.rvOrders.visibility = if (show) View.GONE else View.VISIBLE
    }
    
    private fun showEmpty(show: Boolean) {
        binding.layoutEmpty.visibility = if (show) View.VISIBLE else View.GONE
        binding.rvOrders.visibility = if (show) View.GONE else View.VISIBLE
        
        val statusText = Utils.getOrderStatusText(orderStatus)
        binding.tvEmptyMessage.text = "Belum ada pesanan dengan status $statusText"
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
