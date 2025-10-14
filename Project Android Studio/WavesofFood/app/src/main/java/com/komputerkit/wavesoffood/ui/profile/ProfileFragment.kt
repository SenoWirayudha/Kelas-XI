package com.komputerkit.wavesoffood.ui.profile

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.FragmentProfileBinding
import com.komputerkit.wavesoffood.model.User
import com.komputerkit.wavesoffood.model.Address
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.model.Status
import com.komputerkit.wavesoffood.ui.auth.AuthActivity
import com.komputerkit.wavesoffood.ui.orders.OrdersAdapter

class ProfileFragment : Fragment() {
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private var currentUser: User? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        
        setupClickListeners()
        loadUserProfile()
    }

    private fun setupClickListeners() {
        binding.apply {
            btnEditProfile.setOnClickListener { 
                showEditProfileDialog()
            }
            
            btnOrderHistory.setOnClickListener { 
                showOrderHistoryDialog()
            }
            
            btnLogout.setOnClickListener { 
                logout()
            }
        }
    }

    private fun loadUserProfile() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            // User not logged in, redirect to login
            navigateToLogin()
            return
        }

        db.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    val user = document.toObject(User::class.java)
                    user?.let { displayUserInfo(it) }
                } else {
                    // Create basic user info from Firebase Auth
                    val user = User(
                        id = currentUser.uid,
                        name = currentUser.displayName ?: "User",
                        email = currentUser.email ?: "",
                        phone = currentUser.phoneNumber ?: "",
                        address = null,
                        profileImage = currentUser.photoUrl?.toString() ?: ""
                    )
                    displayUserInfo(user)
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Error loading profile: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun displayUserInfo(user: User) {
        currentUser = user
        binding.apply {
            tvName.text = user.name
            tvEmail.text = user.email
            tvPhone.text = if (user.phone.isNotEmpty()) user.phone else "No phone number"
            tvAddress.text = if (user.address?.fullAddress?.isNotEmpty() == true) user.address?.fullAddress else "No address set"
            
            if (user.profileImage.isNotEmpty()) {
                Glide.with(this@ProfileFragment)
                    .load(user.profileImage)
                    .circleCrop()
                    .placeholder(R.drawable.ic_person)
                    .error(R.drawable.ic_person)
                    .into(ivProfile)
            } else {
                ivProfile.setImageResource(R.drawable.ic_person)
            }
        }
    }

    private fun showEditProfileDialog() {
        if (currentUser == null) {
            Toast.makeText(context, getString(R.string.profile_data_not_loaded), Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_profile, null)
        
        val etName = dialogView.findViewById<EditText>(R.id.etName)
        val etPhone = dialogView.findViewById<EditText>(R.id.etPhone)
        val etAddress = dialogView.findViewById<EditText>(R.id.etAddress)
        
        // Pre-fill with current data
        etName.setText(currentUser?.name ?: "")
        etPhone.setText(currentUser?.phone ?: "")
        etAddress.setText(currentUser?.address?.fullAddress ?: "")
        
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.edit_profile))
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val newName = etName.text.toString().trim()
                val newPhone = etPhone.text.toString().trim()
                val newAddress = etAddress.text.toString().trim()
                
                if (newName.isEmpty()) {
                    Toast.makeText(context, getString(R.string.name_cannot_be_empty), Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                if (newName.length < 2) {
                    Toast.makeText(context, getString(R.string.name_too_short), Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                if (newPhone.isNotEmpty() && !newPhone.matches(Regex("^[+]?[0-9]{10,15}$"))) {
                    Toast.makeText(context, getString(R.string.invalid_phone_number), Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                updateUserProfile(newName, newPhone, newAddress)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun updateUserProfile(name: String, phone: String, address: String) {
        val currentFirebaseUser = auth.currentUser
        if (currentFirebaseUser == null) {
            Toast.makeText(context, getString(R.string.user_not_authenticated), Toast.LENGTH_SHORT).show()
            return
        }
        
        val updatedAddress = if (address.isNotEmpty()) {
            Address(
                fullAddress = address, 
                recipientName = name, 
                phone = if (phone.isNotEmpty()) phone else currentUser?.phone ?: ""
            )
        } else {
            currentUser?.address
        }
        
        val updatedUser = currentUser?.copy(
            name = name,
            phone = phone,
            address = updatedAddress
        )
        
        if (updatedUser == null) {
            Toast.makeText(context, getString(R.string.error_updating_profile), Toast.LENGTH_SHORT).show()
            return
        }
        
        // Show loading
        binding.btnEditProfile.isEnabled = false
        
        // Update in Firestore
        db.collection("users")
            .document(currentFirebaseUser.uid)
            .set(updatedUser)
            .addOnSuccessListener {
                binding.btnEditProfile.isEnabled = true
                Toast.makeText(context, getString(R.string.profile_updated_successfully), Toast.LENGTH_SHORT).show()
                
                // Update local user data and refresh UI
                currentUser = updatedUser
                displayUserInfo(updatedUser)
                
                // Add a subtle animation to indicate update
                binding.apply {
                    tvName.alpha = 0.5f
                    tvPhone.alpha = 0.5f
                    tvAddress.alpha = 0.5f
                    
                    tvName.animate().alpha(1f).setDuration(300).start()
                    tvPhone.animate().alpha(1f).setDuration(300).start()
                    tvAddress.animate().alpha(1f).setDuration(300).start()
                }
            }
            .addOnFailureListener { e ->
                binding.btnEditProfile.isEnabled = true
                Toast.makeText(context, "${getString(R.string.failed_to_update_profile)}: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun showOrderHistoryDialog() {
        val currentFirebaseUser = auth.currentUser
        if (currentFirebaseUser == null) {
            Toast.makeText(context, getString(R.string.user_not_authenticated), Toast.LENGTH_SHORT).show()
            return
        }

        // Create dialog layout
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_order_history, null)
        val recyclerView = dialogView.findViewById<RecyclerView>(R.id.rvOrderHistory)
        val progressBar = dialogView.findViewById<View>(R.id.progressBar)
        val emptyLayout = dialogView.findViewById<View>(R.id.layoutEmpty)
        val tvEmpty = dialogView.findViewById<androidx.appcompat.widget.AppCompatTextView>(R.id.tvEmptyHistory)

        // Setup RecyclerView
        val ordersAdapter = OrdersAdapter { order ->
            // Navigate to order detail
            val bundle = Bundle().apply {
                putString("orderId", order.id)
            }
            findNavController().navigate(R.id.orderDetailFragment, bundle)
        }

        recyclerView.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ordersAdapter
        }

        // Create and show dialog
        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.order_history))
            .setView(dialogView)
            .setNegativeButton("Close", null)
            .create()

        dialog.show()

        // Load delivered orders
        loadDeliveredOrders(currentFirebaseUser.uid, ordersAdapter, progressBar, emptyLayout, dialog)
    }

    private fun loadDeliveredOrders(
        userId: String,
        adapter: OrdersAdapter,
        progressBar: View,
        emptyLayout: View,
        dialog: AlertDialog
    ) {
        progressBar.visibility = View.VISIBLE
        emptyLayout.visibility = View.GONE

        db.collection("orders")
            .whereEqualTo("userId", userId)
            .whereEqualTo("status", "DELIVERED")
            .get()
            .addOnSuccessListener { result ->
                progressBar.visibility = View.GONE

                val deliveredOrders = result.documents.mapNotNull { doc ->
                    try {
                        val data = doc.data ?: return@mapNotNull null
                        
                        val items = (data["items"] as? List<Map<String, Any>>)?.map { itemMap ->
                            com.komputerkit.wavesoffood.model.OrderItem(
                                foodId = itemMap["foodId"] as? String ?: "",
                                name = itemMap["name"] as? String ?: "",
                                price = (itemMap["price"] as? Number)?.toDouble() ?: 0.0,
                                quantity = (itemMap["quantity"] as? Number)?.toInt() ?: 0,
                                totalPrice = (itemMap["totalPrice"] as? Number)?.toDouble() ?: 0.0
                            )
                        } ?: emptyList()
                        
                        val deliveryAddressMap = data["deliveryAddress"] as? Map<String, Any>
                        val deliveryAddress = if (deliveryAddressMap != null) {
                            com.komputerkit.wavesoffood.model.DeliveryAddress(
                                fullAddress = deliveryAddressMap["fullAddress"] as? String ?: "",
                                recipientName = deliveryAddressMap["recipientName"] as? String ?: "",
                                phone = deliveryAddressMap["phone"] as? String ?: "",
                                notes = deliveryAddressMap["notes"] as? String ?: ""
                            )
                        } else {
                            com.komputerkit.wavesoffood.model.DeliveryAddress()
                        }
                        
                        Order(
                            id = doc.id,
                            userId = data["userId"] as? String ?: "",
                            items = items,
                            deliveryAddress = deliveryAddress,
                            status = Status.DELIVERED,
                            subtotal = (data["subtotal"] as? Number)?.toDouble() ?: 0.0,
                            deliveryFee = (data["deliveryFee"] as? Number)?.toDouble() ?: 0.0,
                            total = (data["total"] as? Number)?.toDouble() ?: 0.0,
                            paymentMethod = data["paymentMethod"] as? String ?: "",
                            createdAt = data["createdAt"] as? com.google.firebase.Timestamp,
                            updatedAt = data["updatedAt"] as? com.google.firebase.Timestamp
                        )
                    } catch (e: Exception) {
                        android.util.Log.e("ProfileFragment", "Error parsing order: ${e.message}")
                        null
                    }
                }.sortedByDescending { it.createdAt?.toDate()?.time ?: 0 }

                if (deliveredOrders.isEmpty()) {
                    emptyLayout.visibility = View.VISIBLE
                } else {
                    adapter.submitList(deliveredOrders)
                    // Update dialog title with count
                    dialog.setTitle("${getString(R.string.order_history)} (${deliveredOrders.size})")
                }
            }
            .addOnFailureListener { e ->
                progressBar.visibility = View.GONE
                emptyLayout.visibility = View.VISIBLE
                val tvEmpty = emptyLayout.findViewById<androidx.appcompat.widget.AppCompatTextView>(R.id.tvEmptyHistory)
                tvEmpty.text = "Error loading order history: ${e.message}"
                Toast.makeText(context, getString(R.string.failed_to_load_order_history), Toast.LENGTH_SHORT).show()
            }
    }

    private fun logout() {
        // Sign out from Firebase
        auth.signOut()
        
        navigateToLogin()
    }

    private fun navigateToLogin() {
        try {
            // Navigate back to login screen
            val intent = Intent(requireContext(), AuthActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            requireActivity().finish()
        } catch (e: Exception) {
            Toast.makeText(context, "Error logging out", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
