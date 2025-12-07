package com.komputerkit.wavesoffood.ui.orders

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.FragmentOrdersBinding
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.model.OrderItem
import com.komputerkit.wavesoffood.model.DeliveryAddress
import com.komputerkit.wavesoffood.model.Status

class OrdersFragment : Fragment() {
    private var _binding: FragmentOrdersBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var ordersAdapter: OrdersAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOrdersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        
        setupRecyclerView()
        loadOrders()
    }

    private fun setupRecyclerView() {
        ordersAdapter = OrdersAdapter { order ->
            // Navigate to order detail fragment using Bundle
            val bundle = Bundle().apply {
                putString("orderId", order.id)
            }
            findNavController().navigate(R.id.orderDetailFragment, bundle)
        }
        
        binding.rvOrders.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ordersAdapter
        }
    }

    private fun loadOrders() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(context, "Please login to view orders", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        
        // Get orders from the global orders collection, filtered by userId
        db.collection("orders")
            .whereEqualTo("userId", currentUser.uid)
            .get()
            .addOnSuccessListener { result ->
                binding.progressBar.visibility = View.GONE
                android.util.Log.d("OrdersFragment", "Query successful, found ${result.documents.size} documents")
                
                val orders = result.documents.mapNotNull { doc ->
                    try {
                        // Manual parsing to handle status string/enum conversion
                        val data = doc.data ?: return@mapNotNull null
                        
                        val items = (data["items"] as? List<Map<String, Any>>)?.map { itemMap ->
                            OrderItem(
                                foodId = itemMap["foodId"] as? String ?: "",
                                name = itemMap["name"] as? String ?: "",
                                price = (itemMap["price"] as? Number)?.toDouble() ?: 0.0,
                                quantity = (itemMap["quantity"] as? Number)?.toInt() ?: 0,
                                totalPrice = (itemMap["totalPrice"] as? Number)?.toDouble() ?: 0.0
                            )
                        } ?: emptyList()
                        
                        val deliveryAddressMap = data["deliveryAddress"] as? Map<String, Any>
                        val deliveryAddress = if (deliveryAddressMap != null) {
                            DeliveryAddress(
                                fullAddress = deliveryAddressMap["fullAddress"] as? String ?: "",
                                recipientName = deliveryAddressMap["recipientName"] as? String ?: "",
                                phone = deliveryAddressMap["phone"] as? String ?: "",
                                notes = deliveryAddressMap["notes"] as? String ?: ""
                            )
                        } else {
                            DeliveryAddress()
                        }
                        
                        val statusString = data["status"] as? String ?: "PENDING"
                        val status = try {
                            Status.valueOf(statusString)
                        } catch (e: IllegalArgumentException) {
                            Status.PENDING
                        }
                        
                        Order(
                            id = doc.id,
                            userId = data["userId"] as? String ?: "",
                            items = items,
                            deliveryAddress = deliveryAddress,
                            status = status,
                            subtotal = (data["subtotal"] as? Number)?.toDouble() ?: 0.0,
                            deliveryFee = (data["deliveryFee"] as? Number)?.toDouble() ?: 0.0,
                            total = (data["total"] as? Number)?.toDouble() ?: 0.0,
                            paymentMethod = data["paymentMethod"] as? String ?: "",
                            createdAt = data["createdAt"] as? com.google.firebase.Timestamp,
                            updatedAt = data["updatedAt"] as? com.google.firebase.Timestamp
                        )
                    } catch (e: Exception) {
                        null // Skip malformed documents
                    }
                }
                
                // Sort orders by createdAt in descending order (newest first)
                val sortedOrders = orders.sortedByDescending { order ->
                    order.createdAt?.seconds ?: 0L
                }
                
                if (sortedOrders.isEmpty()) {
                    binding.tvEmptyState.visibility = View.VISIBLE
                    binding.rvOrders.visibility = View.GONE
                } else {
                    binding.tvEmptyState.visibility = View.GONE
                    binding.rvOrders.visibility = View.VISIBLE
                    ordersAdapter.submitList(sortedOrders)
                }
            }
            .addOnFailureListener { e ->
                binding.progressBar.visibility = View.GONE
                android.util.Log.e("OrdersFragment", "Error loading orders", e)
                Toast.makeText(context, "Error loading orders: ${e.message}", Toast.LENGTH_SHORT).show()
                
                // Show empty state on error
                binding.tvEmptyState.visibility = View.VISIBLE
                binding.rvOrders.visibility = View.GONE
            }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
