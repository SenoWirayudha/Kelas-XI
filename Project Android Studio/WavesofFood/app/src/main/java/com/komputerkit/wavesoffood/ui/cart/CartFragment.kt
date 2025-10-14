package com.komputerkit.wavesoffood.ui.cart

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.model.*
import com.komputerkit.wavesoffood.databinding.FragmentCartBinding
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class CartFragment : Fragment() {
    private var _binding: FragmentCartBinding? = null
    private val binding get() = _binding!!

    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()
    private lateinit var cartAdapter: CartAdapter
    
    // Add listener registration to properly remove it later
    private var cartListener: com.google.firebase.firestore.ListenerRegistration? = null

    private val deliveryFee = 5000.0
    private var subtotal = 0.0
    private var currentCartItems: List<CartItem> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCartBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        loadCartItems()
        setupCheckoutButton()
    }

    private fun setupRecyclerView() {
        if (_binding == null || !isAdded) return
        
        cartAdapter = CartAdapter(
            onQuantityChanged = { item, newQuantity ->
                updateCartItemQuantity(item, newQuantity)
            },
            onDeleteClick = { item ->
                showDeleteConfirmationDialog(item)
            }
        )

        binding.rvCart.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = cartAdapter
        }
    }

    private fun loadCartItems() {
        val userId = auth.currentUser?.uid ?: return
        
        // Remove existing listener if any
        cartListener?.remove()
        
        cartListener = db.collection("users")
            .document(userId)
            .collection("cart")
            .addSnapshotListener { snapshot, error ->
                // Check if fragment is still attached before processing
                if (!isAdded || _binding == null) {
                    return@addSnapshotListener
                }
                
                if (error != null) {
                    context?.let { ctx ->
                        Toast.makeText(ctx, "Error: ${error.message}", Toast.LENGTH_SHORT).show()
                    }
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val cartItems = snapshot.documents.mapNotNull { doc ->
                        doc.toObject(CartItem::class.java)?.copy(id = doc.id)
                    }
                    updateUI(cartItems)
                }
            }
    }

    private fun updateUI(cartItems: List<CartItem>) {
        // Check if fragment is still attached and binding is not null
        if (_binding == null || !isAdded) {
            return
        }
        
        currentCartItems = cartItems
        cartAdapter.submitList(cartItems)
        
        binding.apply {
            if (cartItems.isEmpty()) {
                rvCart.visibility = View.GONE
                cardCheckout.visibility = View.GONE
                tvEmptyCart.visibility = View.VISIBLE
            } else {
                rvCart.visibility = View.VISIBLE
                cardCheckout.visibility = View.VISIBLE
                tvEmptyCart.visibility = View.GONE
                
                subtotal = cartItems.sumOf { it.totalPrice }
                val total = subtotal + deliveryFee

                tvSubtotal.text = getString(R.string.currency, subtotal.toString())
                tvDeliveryFee.text = getString(R.string.currency, deliveryFee.toString())
                tvTotal.text = getString(R.string.currency, total.toString())
            }
        }
    }

    private fun updateCartItemQuantity(item: CartItem, newQuantity: Int) {
        val userId = auth.currentUser?.uid ?: return
        
        if (newQuantity <= 0) {
            // If quantity is 0 or negative, remove the item
            deleteCartItem(item)
            return
        }
        
        val newTotalPrice = item.price * newQuantity

        db.collection("users")
            .document(userId)
            .collection("cart")
            .document(item.id)
            .update(
                mapOf(
                    "quantity" to newQuantity,
                    "totalPrice" to newTotalPrice
                )
            )
            .addOnSuccessListener {
                if (isAdded && context != null) {
                    Toast.makeText(context, getString(R.string.cart_updated), Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { e ->
                if (isAdded && context != null) {
                    Toast.makeText(context, "Error updating cart: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun showDeleteConfirmationDialog(item: CartItem) {
        AlertDialog.Builder(requireContext())
            .setMessage(getString(R.string.confirm_remove_item))
            .setPositiveButton(getString(R.string.yes)) { _, _ ->
                deleteCartItem(item)
            }
            .setNegativeButton(getString(R.string.no), null)
            .show()
    }

    private fun deleteCartItem(item: CartItem) {
        val userId = auth.currentUser?.uid ?: return

        db.collection("users")
            .document(userId)
            .collection("cart")
            .document(item.id)
            .delete()
            .addOnSuccessListener {
                if (isAdded && context != null) {
                    Toast.makeText(context, getString(R.string.item_removed), Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { e ->
                if (isAdded && context != null) {
                    Toast.makeText(context, "Error removing item: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun setupCheckoutButton() {
        if (_binding == null || !isAdded) return
        
        binding.btnCheckout.setOnClickListener {
            proceedToCheckout()
        }
    }

    private var selectedPaymentMethod: String? = null

    private fun proceedToCheckout() {
        if (!isAdded || context == null) return
        
        val userId = auth.currentUser?.uid
        if (userId == null) {
            Toast.makeText(context, "Please login to proceed", Toast.LENGTH_SHORT).show()
            return
        }

        if (currentCartItems.isEmpty()) {
            Toast.makeText(context, "Your cart is empty", Toast.LENGTH_SHORT).show()
            return
        }

        // Navigate to checkout screen
        try {
            findNavController().navigate(R.id.action_navigation_cart_to_checkoutFragment)
        } catch (e: Exception) {
            Toast.makeText(context, "Navigation error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Remove Firestore listener to prevent memory leaks and crashes
        cartListener?.remove()
        cartListener = null
        _binding = null
    }
}
