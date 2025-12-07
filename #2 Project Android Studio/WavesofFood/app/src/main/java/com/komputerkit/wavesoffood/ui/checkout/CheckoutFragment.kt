package com.komputerkit.wavesoffood.ui.checkout

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import com.google.firebase.Timestamp
import com.komputerkit.wavesoffood.databinding.FragmentCheckoutBinding
import com.komputerkit.wavesoffood.model.*
import com.komputerkit.wavesoffood.data.FirebaseManager
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.*

class CheckoutFragment : Fragment() {
    
    private var _binding: FragmentCheckoutBinding? = null
    private val binding get() = _binding!!
    
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()
    
    private lateinit var checkoutItemsAdapter: CheckoutItemsAdapter
    private var cartItems: List<CartItem> = emptyList()
    private var userAddress: Address? = null
    
    private val deliveryFee = 5000.0
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCheckoutBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupClickListeners()
        loadCartItems()
        loadUserAddress()
    }
    
    private fun setupRecyclerView() {
        checkoutItemsAdapter = CheckoutItemsAdapter()
        binding.rvCheckoutItems.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = checkoutItemsAdapter
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnEditAddress.setOnClickListener {
            showAddressOptionsDialog()
        }
        
        binding.btnPlaceOrder.setOnClickListener {
            placeOrder()
        }
    }
    
    private fun loadCartItems() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            showError("Please login first")
            return
        }
        
        showLoading(true)
        android.util.Log.d("CheckoutFragment", "Loading cart items for user: ${currentUser.uid}")
        
        // Use the correct path: users/{userId}/cart (not carts/{userId})
        db.collection("users")
            .document(currentUser.uid)
            .collection("cart")
            .get()
            .addOnSuccessListener { querySnapshot ->
                try {
                    // Convert documents to CartItem objects
                    cartItems = querySnapshot.documents.mapNotNull { document ->
                        document.toObject(CartItem::class.java)?.copy(id = document.id)
                    }
                    
                    android.util.Log.d("CheckoutFragment", "Loaded ${cartItems.size} cart items")
                    
                    if (cartItems.isEmpty()) {
                        showLoading(false)
                        android.util.Log.d("CheckoutFragment", "No cart items found")
                        showEmptyCartState()
                        return@addOnSuccessListener
                    }
                    
                    // Update UI with cart items
                    android.util.Log.d("CheckoutFragment", "Submitting ${cartItems.size} items to adapter")
                    checkoutItemsAdapter.submitList(cartItems)
                    updateOrderSummary()
                    showLoading(false)
                    
                    android.util.Log.d("CheckoutFragment", "Cart items loaded successfully")
                    
                } catch (e: Exception) {
                    showLoading(false)
                    android.util.Log.e("CheckoutFragment", "Error processing cart items: ${e.message}")
                    showError("Error loading cart: ${e.message}")
                }
            }
            .addOnFailureListener { e ->
                showLoading(false)
                android.util.Log.e("CheckoutFragment", "Failed to load cart: ${e.message}")
                
                // Try alternative method using FirebaseManager
                loadCartItemsAlternative()
            }
    }
    
    private fun loadCartItemsAlternative() {
        android.util.Log.d("CheckoutFragment", "Trying alternative cart loading method")
        
        lifecycleScope.launch {
            try {
                val cartItemsList = FirebaseManager.getCartItems()
                
                android.util.Log.d("CheckoutFragment", "Alternative method loaded ${cartItemsList.size} items")
                
                cartItems = cartItemsList
                
                if (cartItems.isEmpty()) {
                    showEmptyCartState()
                    return@launch
                }
                
                // Update UI with cart items
                android.util.Log.d("CheckoutFragment", "Submitting ${cartItems.size} items to adapter (alternative)")
                checkoutItemsAdapter.submitList(cartItems)
                updateOrderSummary()
                
            } catch (e: Exception) {
                android.util.Log.e("CheckoutFragment", "Alternative cart loading failed: ${e.message}")
                showError("Failed to load cart items: ${e.message}")
            }
        }
    }
    
    private fun loadUserAddress() {
        val currentUser = auth.currentUser ?: return
        
        android.util.Log.d("CheckoutFragment", "Loading user address for user: ${currentUser.uid}")
        
        db.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    try {
                        val user = document.toObject(User::class.java)
                        val address = user?.address
                        
                        android.util.Log.d("CheckoutFragment", "User data loaded: ${user?.name}, address: $address")
                        
                        if (address != null && address.fullAddress.isNotEmpty()) {
                            userAddress = address
                            displayAddress(address)
                            android.util.Log.d("CheckoutFragment", "Address found and displayed")
                        } else {
                            setDefaultAddress()
                            android.util.Log.d("CheckoutFragment", "No address found, showing default")
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("CheckoutFragment", "Error parsing user data: ${e.message}")
                        setDefaultAddress()
                    }
                } else {
                    android.util.Log.d("CheckoutFragment", "User document does not exist")
                    setDefaultAddress()
                }
            }
            .addOnFailureListener { e ->
                android.util.Log.e("CheckoutFragment", "Failed to load user address: ${e.message}")
                setDefaultAddress()
            }
    }
    
    private fun displayAddress(address: Address) {
        binding.apply {
            tvRecipientName.text = if (address.recipientName.isNotEmpty()) {
                address.recipientName
            } else {
                "No name provided"
            }
            
            tvPhoneNumber.text = if (address.phone.isNotEmpty()) {
                address.phone
            } else {
                "No phone provided"
            }
            
            tvDeliveryAddress.text = if (address.fullAddress.isNotEmpty()) {
                address.fullAddress
            } else {
                "No address provided"
            }
        }
        
        // Log for debugging
        android.util.Log.d("CheckoutFragment", "Address displayed: ${address.recipientName}, ${address.phone}, ${address.fullAddress}")
    }
    
    private fun setDefaultAddress() {
        binding.apply {
            tvRecipientName.text = "Please set your delivery address"
            tvPhoneNumber.text = "No phone number"
            tvDeliveryAddress.text = "No address provided"
        }
    }
    
    private fun showAddressOptionsDialog() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            showError("Please login first")
            return
        }
        
        // Load saved addresses
        db.collection("users")
            .document(currentUser.uid)
            .collection("addresses")
            .get()
            .addOnSuccessListener { documents ->
                val savedAddresses = documents.mapNotNull { doc ->
                    doc.toObject(Address::class.java)?.copy(id = doc.id)
                }
                
                if (savedAddresses.isEmpty()) {
                    // No saved addresses, directly show add address dialog
                    showAddAddressDialog()
                } else {
                    // Show address selection dialog
                    showAddressSelectionDialog(savedAddresses)
                }
            }
            .addOnFailureListener {
                // If failed to load, still allow adding new address
                showAddAddressDialog()
            }
    }
    
    private fun showAddressSelectionDialog(savedAddresses: List<Address>) {
        val addressOptions = savedAddresses.map { address ->
            "${address.label}: ${address.recipientName} - ${address.fullAddress.take(50)}${if (address.fullAddress.length > 50) "..." else ""}"
        }.toMutableList()
        
        // Add option to add new address
        addressOptions.add("+ Add New Address")
        
        AlertDialog.Builder(requireContext())
            .setTitle("Select Delivery Address")
            .setItems(addressOptions.toTypedArray()) { _, which ->
                if (which == addressOptions.size - 1) {
                    // User selected "Add New Address"
                    showAddAddressDialog()
                } else {
                    // User selected existing address
                    val selectedAddress = savedAddresses[which]
                    userAddress = selectedAddress
                    displayAddress(selectedAddress)
                    
                    // Update user's default address
                    updateUserDefaultAddress(selectedAddress)
                    
                    Toast.makeText(
                        context,
                        "Address selected: ${selectedAddress.label}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .create()
            .show()
    }
    
    private fun updateUserDefaultAddress(address: Address) {
        val currentUser = auth.currentUser ?: return
        
        db.collection("users")
            .document(currentUser.uid)
            .update("address", address)
            .addOnSuccessListener {
                // Successfully updated default address
            }
            .addOnFailureListener {
                // Failed to update but address is still selected locally
            }
    }
    
    private fun showAddAddressDialog() {
        // Create layout programmatically
        val layout = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 32, 48, 32)
        }
        
        // Create input fields
        val etRecipientName = EditText(requireContext()).apply {
            hint = "Recipient Name"
            setText(userAddress?.recipientName ?: "")
        }
        
        val etPhoneNumber = EditText(requireContext()).apply {
            hint = "Phone Number"
            setText(userAddress?.phone ?: "")
            inputType = android.text.InputType.TYPE_CLASS_PHONE
        }
        
        val etFullAddress = EditText(requireContext()).apply {
            hint = "Full Address"
            setText(userAddress?.fullAddress ?: "")
            minLines = 3
            maxLines = 5
        }
        
        val etAddressLabel = EditText(requireContext()).apply {
            hint = "Address Label (e.g., Home, Office)"
            setText(userAddress?.label ?: "Home")
        }
        
        val etNotes = EditText(requireContext()).apply {
            hint = "Additional Notes (Optional)"
            setText(userAddress?.notes ?: "")
            minLines = 2
            maxLines = 3
        }
        
        // Add views to layout with styling
        listOf(etRecipientName, etPhoneNumber, etFullAddress, etAddressLabel, etNotes).forEach { editText ->
            editText.apply {
                setPadding(32, 24, 32, 24)
                setBackgroundResource(android.R.drawable.edit_text)
                val layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                layoutParams.setMargins(0, 16, 0, 16)
                this.layoutParams = layoutParams
            }
            layout.addView(editText)
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("Add Delivery Address")
            .setView(layout)
            .setPositiveButton("Save") { _, _ ->
                val recipientName = etRecipientName.text.toString().trim()
                val phoneNumber = etPhoneNumber.text.toString().trim()
                val fullAddress = etFullAddress.text.toString().trim()
                val addressLabel = etAddressLabel.text.toString().trim()
                val notes = etNotes.text.toString().trim()
                
                if (validateAddressInput(recipientName, phoneNumber, fullAddress)) {
                    saveAddress(recipientName, phoneNumber, fullAddress, addressLabel, notes)
                }
            }
            .setNegativeButton("Cancel", null)
            .create()
            .show()
    }
    
    private fun validateAddressInput(
        recipientName: String,
        phoneNumber: String,
        fullAddress: String
    ): Boolean {
        when {
            recipientName.isEmpty() -> {
                showError("Please enter recipient name")
                return false
            }
            phoneNumber.isEmpty() -> {
                showError("Please enter phone number")
                return false
            }
            phoneNumber.length < 10 -> {
                showError("Please enter a valid phone number")
                return false
            }
            fullAddress.isEmpty() -> {
                showError("Please enter full address")
                return false
            }
            fullAddress.length < 10 -> {
                showError("Please enter a detailed address")
                return false
            }
            else -> return true
        }
    }
    
    private fun saveAddress(
        recipientName: String,
        phoneNumber: String,
        fullAddress: String,
        addressLabel: String,
        notes: String
    ) {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            showError("Please login first")
            return
        }
        
        showLoading(true)
        
        // Create new address object
        val newAddress = Address(
            id = "", // Will be set by Firestore
            label = addressLabel.ifEmpty { "Home" },
            fullAddress = fullAddress,
            recipientName = recipientName,
            phone = phoneNumber,
            notes = notes,
            isDefault = true // Set as default for now
        )
        
        // Log the address being saved
        android.util.Log.d("CheckoutFragment", "Saving address: $recipientName, $phoneNumber, $fullAddress")
        
        // First save to user's addresses collection
        db.collection("users")
            .document(currentUser.uid)
            .collection("addresses")
            .add(newAddress)
            .addOnSuccessListener { documentReference ->
                // Then update user's default address
                val addressWithId = newAddress.copy(id = documentReference.id)
                
                db.collection("users")
                    .document(currentUser.uid)
                    .update("address", addressWithId)
                    .addOnSuccessListener {
                        showLoading(false)
                        
                        // Update local address and UI immediately
                        userAddress = addressWithId
                        displayAddress(addressWithId)
                        
                        android.util.Log.d("CheckoutFragment", "Address saved successfully and UI updated")
                        
                        Toast.makeText(
                            context,
                            "Address saved successfully!",
                            Toast.LENGTH_SHORT
                        ).show()
                        
                        // Refresh the address display to make sure it's updated
                        refreshAddressDisplay()
                    }
                    .addOnFailureListener { e ->
                        showLoading(false)
                        // Even if default address update fails, still use the saved address
                        userAddress = addressWithId
                        displayAddress(addressWithId)
                        
                        android.util.Log.w("CheckoutFragment", "Address saved but failed to set as default: ${e.message}")
                        
                        Toast.makeText(
                            context,
                            "Address saved successfully!",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
            }
            .addOnFailureListener { e ->
                showLoading(false)
                showError("Failed to save address: ${e.message}")
                android.util.Log.e("CheckoutFragment", "Failed to save address: ${e.message}")
            }
    }
    
    private fun updateOrderSummary() {
        val subtotal = cartItems.sumOf { it.totalPrice }
        val total = subtotal + deliveryFee
        
        android.util.Log.d("CheckoutFragment", "Order Summary - Subtotal: $subtotal, Delivery: $deliveryFee, Total: $total")
        
        binding.apply {
            tvSubtotal.text = currencyFormat.format(subtotal)
            tvDeliveryFee.text = currencyFormat.format(deliveryFee)
            tvTotal.text = currencyFormat.format(total)
        }
        
        android.util.Log.d("CheckoutFragment", "Order summary UI updated")
    }
    
    private fun getSelectedPaymentMethod(): String {
        return when (binding.rgPaymentMethod.checkedRadioButtonId) {
            binding.rbBankTransfer.id -> "Bank Transfer"
            binding.rbEWallet.id -> "E-Wallet"
            else -> "Cash on Delivery"
        }
    }
    
    private fun placeOrder() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            showError("Please login first")
            return
        }
        
        if (cartItems.isEmpty()) {
            showError("Your cart is empty")
            return
        }
        
        if (userAddress == null) {
            showError("Please set your delivery address")
            return
        }
        
        showLoading(true)
        binding.btnPlaceOrder.isEnabled = false
        
        val deliveryNotes = binding.etDeliveryNotes.text.toString().trim()
        val paymentMethod = getSelectedPaymentMethod()
        val subtotal = cartItems.sumOf { it.totalPrice }
        val total = subtotal + deliveryFee
        
        // Create delivery address with notes
        val deliveryAddress = DeliveryAddress(
            fullAddress = userAddress?.fullAddress ?: "",
            recipientName = userAddress?.recipientName ?: "",
            phone = userAddress?.phone ?: "",
            notes = deliveryNotes
        )
        
        // Convert cart items to order items
        val orderItems = cartItems.map { cartItem ->
            OrderItem(
                foodId = cartItem.foodId,
                name = cartItem.name,
                price = cartItem.price,
                quantity = cartItem.quantity,
                totalPrice = cartItem.totalPrice
            )
        }
        
        // Create order object
        val order = Order(
            userId = currentUser.uid,
            items = orderItems,
            subtotal = subtotal,
            deliveryFee = deliveryFee,
            total = total,
            status = Status.PENDING,
            paymentMethod = paymentMethod,
            deliveryAddress = deliveryAddress,
            createdAt = Timestamp.now(),
            updatedAt = Timestamp.now()
        )
        
        // Save order to Firestore
        db.collection("orders")
            .add(order)
            .addOnSuccessListener { documentReference ->
                // Clear cart after successful order
                clearCart(currentUser.uid) {
                    showLoading(false)
                    binding.btnPlaceOrder.isEnabled = true
                    
                    Toast.makeText(context, "Order placed successfully!", Toast.LENGTH_LONG).show()
                    
                    // Navigate to order detail or orders list
                    findNavController().navigateUp()
                }
            }
            .addOnFailureListener { e ->
                showLoading(false)
                binding.btnPlaceOrder.isEnabled = true
                showError("Failed to place order: ${e.message}")
            }
    }
    
    private fun clearCart(userId: String, onComplete: () -> Unit) {
        // Use the correct path: users/{userId}/cart
        val cartRef = db.collection("users")
            .document(userId)
            .collection("cart")
        
        cartRef.get()
            .addOnSuccessListener { querySnapshot ->
                // Delete all cart items
                val batch = db.batch()
                querySnapshot.documents.forEach { document ->
                    batch.delete(document.reference)
                }
                
                batch.commit()
                    .addOnSuccessListener {
                        android.util.Log.d("CheckoutFragment", "Cart cleared successfully")
                        onComplete()
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("CheckoutFragment", "Failed to clear cart: ${e.message}")
                        onComplete() // Still complete even if cart clear fails
                    }
            }
            .addOnFailureListener { e ->
                android.util.Log.e("CheckoutFragment", "Failed to get cart items for clearing: ${e.message}")
                onComplete() // Still complete even if cart clear fails
            }
    }
    
    private fun showLoading(isLoading: Boolean) {
        binding.apply {
            if (isLoading) {
                progressBar.visibility = View.VISIBLE
                contentLayout.alpha = 0.5f
            } else {
                progressBar.visibility = View.GONE
                contentLayout.alpha = 1.0f
            }
        }
    }
    
    private fun showError(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }
    
    private fun refreshAddressDisplay() {
        // Force refresh the address display by reloading from current userAddress
        userAddress?.let { address ->
            displayAddress(address)
            android.util.Log.d("CheckoutFragment", "Address display refreshed")
        } ?: loadUserAddress()
    }
    
    private fun showEmptyCartState() {
        // Show empty cart message
        Toast.makeText(context, "Your cart is empty. Please add items to your cart first.", Toast.LENGTH_LONG).show()
        
        // Navigate back to previous screen
        findNavController().navigateUp()
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
