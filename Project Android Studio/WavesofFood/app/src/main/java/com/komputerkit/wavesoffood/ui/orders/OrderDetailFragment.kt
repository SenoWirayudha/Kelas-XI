package com.komputerkit.wavesoffood.ui.orders

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.FragmentOrderDetailBinding
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.model.OrderItem
import com.komputerkit.wavesoffood.model.Status
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

class OrderDetailFragment : Fragment() {
    
    private var _binding: FragmentOrderDetailBinding? = null
    private val binding get() = _binding!!
    
    private val db = FirebaseFirestore.getInstance()
    private lateinit var orderItemsAdapter: OrderItemsAdapter
    private lateinit var ratingItemsAdapter: OrderItemsRatingAdapter
    private var orderId: String? = null
    private var currentOrder: Order? = null
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOrderDetailBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get orderId from arguments
        orderId = arguments?.getString("orderId")
        
        if (orderId == null) {
            showError("Order ID not found")
            return
        }
        
        setupRecyclerView()
        setupClickListeners()
        loadOrderDetail()
    }
    
    private fun setupRecyclerView() {
        orderItemsAdapter = OrderItemsAdapter()
        binding.rvOrderItems.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = orderItemsAdapter
        }
        
        ratingItemsAdapter = OrderItemsRatingAdapter { orderItem, rating, review ->
            submitItemRating(orderItem, rating, review)
        }
        binding.rvRatingItems.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ratingItemsAdapter
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnCancelOrder.setOnClickListener {
            showCancelOrderDialog()
        }
    }
    
    private fun loadOrderDetail() {
        showLoading(true)
        
        db.collection("orders")
            .document(orderId!!)
            .get()
            .addOnSuccessListener { document ->
                showLoading(false)
                
                if (document.exists()) {
                    try {
                        val order = document.toObject(Order::class.java)
                        if (order != null) {
                            currentOrder = order.copy(id = document.id)
                            displayOrderDetail(currentOrder!!)
                        } else {
                            showError("Failed to parse order data")
                        }
                    } catch (e: Exception) {
                        showError("Error loading order: ${e.message}")
                    }
                } else {
                    showError("Order not found")
                }
            }
            .addOnFailureListener { e ->
                showLoading(false)
                showError("Failed to load order: ${e.message}")
            }
    }
    
    private fun displayOrderDetail(order: Order) {
        binding.apply {
            // Order Info
            tvOrderId.text = "Order #${order.id.take(8)}"
            tvOrderDate.text = formatDate(order.createdAt?.toDate())
            tvOrderStatus.text = order.status.name
            tvPaymentMethod.text = order.paymentMethod
            
            // Set status color and background
            val (statusColor, backgroundColor) = when (order.status) {
                Status.PENDING -> Pair(R.color.white, R.color.warning_color)
                Status.CONFIRMED -> Pair(R.color.white, R.color.info_color)
                Status.PREPARING -> Pair(R.color.white, R.color.primary_color)
                Status.READY -> Pair(R.color.white, R.color.primary_color)
                Status.OUT_FOR_DELIVERY -> Pair(R.color.white, R.color.primary_color)
                Status.DELIVERED -> Pair(R.color.white, R.color.success_color)
                Status.CANCELLED -> Pair(R.color.white, R.color.error_color)
            }
            
            tvOrderStatus.setTextColor(requireContext().getColor(statusColor))
            tvOrderStatus.setBackgroundColor(requireContext().getColor(backgroundColor))
            
            // Add rounded corners to status background
            val drawable = tvOrderStatus.background
            if (drawable is android.graphics.drawable.ColorDrawable) {
                val shape = android.graphics.drawable.GradientDrawable()
                shape.shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                shape.setColor(requireContext().getColor(backgroundColor))
                shape.cornerRadius = 12f * resources.displayMetrics.density
                tvOrderStatus.background = shape
            }
            
            // Delivery Address
            with(order.deliveryAddress) {
                tvRecipientName.text = recipientName
                tvPhoneNumber.text = phone
                tvDeliveryAddress.text = fullAddress
                tvDeliveryNotes.text = if (notes.isNotEmpty()) notes else "No special notes"
            }
            
            // Order Items
            orderItemsAdapter.submitList(order.items)
            
            // Price Summary
            val currencyFormat = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
            tvSubtotal.text = currencyFormat.format(order.subtotal)
            tvDeliveryFee.text = currencyFormat.format(order.deliveryFee)
            tvTotal.text = currencyFormat.format(order.total)
            
            // Show/hide cancel button based on order status
            btnCancelOrder.visibility = if (order.status == Status.PENDING) {
                View.VISIBLE
            } else {
                View.GONE
            }
            
            // Show/hide rating section based on order status and rating status
            if (order.status == Status.DELIVERED) {
                cardRating.visibility = View.VISIBLE
                setupRatingSection(order)
            } else {
                cardRating.visibility = View.GONE
            }
        }
    }
    
    private fun setupRatingSection(order: Order) {
        ratingItemsAdapter.submitList(order.items)
        
        val allItemsRated = order.items.all { it.hasRated }
        binding.tvRatingStatus.visibility = if (allItemsRated && order.items.isNotEmpty()) {
            View.VISIBLE
        } else {
            View.GONE
        }
    }
    
    private fun formatDate(date: Date?): String {
        return if (date != null) {
            val formatter = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
            formatter.format(date)
        } else {
            "Unknown date"
        }
    }
    
    private fun showLoading(isLoading: Boolean) {
        binding.apply {
            if (isLoading) {
                progressBar.visibility = View.VISIBLE
                contentLayout.visibility = View.GONE
            } else {
                progressBar.visibility = View.GONE
                contentLayout.visibility = View.VISIBLE
            }
        }
    }
    
    private fun showError(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        findNavController().navigateUp()
    }
    
    private fun showCancelOrderDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle("Cancel Order")
            .setMessage("Are you sure you want to cancel this order? This action cannot be undone.")
            .setPositiveButton("Yes, Cancel") { _, _ ->
                cancelOrder()
            }
            .setNegativeButton("No, Keep Order") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun cancelOrder() {
        if (currentOrder == null) return
        
        showLoading(true)
        
        // Update order status to CANCELLED
        db.collection("orders")
            .document(currentOrder!!.id)
            .update("status", Status.CANCELLED)
            .addOnSuccessListener {
                showLoading(false)
                Toast.makeText(context, "Order cancelled successfully", Toast.LENGTH_SHORT).show()
                
                // Update current order and refresh UI
                currentOrder = currentOrder!!.copy(status = Status.CANCELLED)
                displayOrderDetail(currentOrder!!)
            }
            .addOnFailureListener { e ->
                showLoading(false)
                Toast.makeText(context, "Failed to cancel order: ${e.message}", Toast.LENGTH_LONG).show()
            }
    }
    
    private fun submitItemRating(orderItem: OrderItem, rating: Float, review: String) {
        if (currentOrder == null) return
        
        showLoading(true)
        
        // Update the specific order item with rating
        val updatedItems = currentOrder!!.items.map { item ->
            if (item.id == orderItem.id) {  // Use unique OrderItem ID
                item.copy(rating = rating, review = review, hasRated = true)
            } else {
                item
            }
        }
        
        // Check if all items are now rated
        val allItemsRated = updatedItems.all { it.hasRated }
        
        // Update order in Firestore
        val updateMap = mapOf(
            "items" to updatedItems.map { item ->
                mapOf(
                    "id" to item.id,
                    "foodId" to item.foodId,
                    "name" to item.name,
                    "price" to item.price,
                    "quantity" to item.quantity,
                    "totalPrice" to item.totalPrice,
                    "rating" to item.rating,
                    "review" to item.review,
                    "hasRated" to item.hasRated
                )
            },
            "hasRatedAllItems" to allItemsRated,
            "updatedAt" to com.google.firebase.Timestamp.now()
        )
        
        db.collection("orders")
            .document(currentOrder!!.id)
            .update(updateMap)
            .addOnSuccessListener {
                // Update food rating for this specific item
                updateSingleFoodRating(orderItem.foodId, rating)
                
                // Update current order and refresh UI
                currentOrder = currentOrder!!.copy(
                    items = updatedItems,
                    hasRatedAllItems = allItemsRated
                )
                setupRatingSection(currentOrder!!)
                showLoading(false)
                
                android.widget.Toast.makeText(
                    context,
                    "Thank you for rating ${orderItem.name}!",
                    android.widget.Toast.LENGTH_SHORT
                ).show()
            }
            .addOnFailureListener { e ->
                showLoading(false)
                android.widget.Toast.makeText(
                    context,
                    "Failed to submit rating: ${e.message}",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            }
    }
    
    private fun updateSingleFoodRating(foodId: String, rating: Float) {
        if (foodId.isEmpty()) return
        
        val foodRef = db.collection("foods").document(foodId)
        
        foodRef.get()
            .addOnSuccessListener { foodDoc ->
                if (foodDoc.exists()) {
                    val currentRating = foodDoc.getDouble("rating")?.toFloat() ?: 0f
                    val currentReviewCount = foodDoc.getLong("reviewCount")?.toInt() ?: 0
                    
                    // Calculate new average rating
                    val newReviewCount = currentReviewCount + 1
                    val newRating = if (currentReviewCount == 0) {
                        rating
                    } else {
                        ((currentRating * currentReviewCount) + rating) / newReviewCount
                    }
                    
                    // Update food document
                    foodRef.update(mapOf(
                        "rating" to newRating,
                        "reviewCount" to newReviewCount,
                        "updatedAt" to com.google.firebase.Timestamp.now()
                    ))
                }
            }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
