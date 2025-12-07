package com.komputerkit.wavesoffood.ui.home

import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.bumptech.glide.Glide
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.FragmentFoodDetailBinding

class FoodDetailFragment : Fragment() {
    private var _binding: FragmentFoodDetailBinding? = null
    private val binding get() = _binding!!
    private val args: FoodDetailFragmentArgs by navArgs()
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private var quantity = 1

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFoodDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupToolbar()
        displayFoodDetails()
        setupQuantityControls()
        setupAddToCartButton()
    }

    private fun setupToolbar() {
        val food = args.food
        
        // Remove title from CollapsingToolbarLayout - clean toolbar without text
        binding.collapsingToolbar.title = ""
        
        binding.toolbar.apply {
            setNavigationIcon(R.drawable.ic_arrow_back)
            navigationIcon?.setTint(resources.getColor(android.R.color.white, null))
            setNavigationOnClickListener {
                // Add haptic feedback for better UX
                it.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                findNavController().navigateUp()
            }
        }
    }

    private fun displayFoodDetails() {
        val food = args.food
        
        binding.apply {
            tvName.text = food.name
            tvPrice.text = getString(R.string.currency, food.price.toString())
            tvDescription.text = food.description
            ratingBar.rating = food.rating
            tvRatingCount.text = getString(R.string.reviews, food.reviewCount)
            
            // Check if food is available
            if (!food.isAvailable) {
                // Menu tidak tersedia - disable semua interaksi
                btnAddToCart.isEnabled = false
                btnAddToCart.text = "Menu Tidak Tersedia"
                btnAddToCart.alpha = 0.6f
                
                btnMinus.isEnabled = false
                btnPlus.isEnabled = false
                btnMinus.alpha = 0.6f
                btnPlus.alpha = 0.6f
                
                // Tambahkan overlay atau teks peringatan
                ivFood.alpha = 0.7f
            } else {
                // Menu tersedia - tampilan normal
                btnAddToCart.isEnabled = true
                btnAddToCart.text = getString(R.string.add_to_cart)
                btnAddToCart.alpha = 1.0f
                
                btnMinus.isEnabled = true
                btnPlus.isEnabled = true
                btnMinus.alpha = 1.0f
                btnPlus.alpha = 1.0f
                
                ivFood.alpha = 1.0f
            }
            
            Glide.with(requireContext())
                .load(food.imageUrl)
                .centerCrop()
                .into(ivFood)
        }
    }

    private fun setupQuantityControls() {
        val food = args.food
        
        binding.apply {
            btnMinus.setOnClickListener {
                if (food.isAvailable && quantity > 1) {
                    quantity--
                    updateQuantityDisplay()
                }
            }

            btnPlus.setOnClickListener {
                if (food.isAvailable) {
                    quantity++
                    updateQuantityDisplay()
                }
            }

            updateQuantityDisplay()
        }
    }

    private fun updateQuantityDisplay() {
        binding.tvQuantity.text = quantity.toString()
    }

    private fun setupAddToCartButton() {
        binding.btnAddToCart.setOnClickListener {
            addToCart()
        }
    }

    private fun addToCart() {
        val food = args.food
        
        // Check if food is available
        if (!food.isAvailable) {
            Toast.makeText(context, "Menu tidak tersedia saat ini", Toast.LENGTH_SHORT).show()
            return
        }
        
        val userId = auth.currentUser?.uid
        if (userId == null) {
            Toast.makeText(context, "Please login to add items to cart", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Validate food object and quantity
        if (food.id.isEmpty() || food.name.isEmpty()) {
            Toast.makeText(context, "Invalid food item", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (quantity <= 0) {
            Toast.makeText(context, "Please select a valid quantity", Toast.LENGTH_SHORT).show()
            return
        }
        
        val cartItem = hashMapOf(
            "foodId" to food.id,
            "name" to food.name,
            "price" to food.price,
            "quantity" to quantity,
            "imageUrl" to food.imageUrl,
            "totalPrice" to (food.price * quantity)
        )

        db.collection("users")
            .document(userId)
            .collection("cart")
            .whereEqualTo("foodId", food.id)
            .get()
            .addOnSuccessListener { documents ->
                if (documents.isEmpty) {
                    // Add new item to cart
                    db.collection("users")
                        .document(userId)
                        .collection("cart")
                        .add(cartItem)
                        .addOnSuccessListener {
                            Toast.makeText(context, getString(R.string.added_to_cart), Toast.LENGTH_SHORT).show()
                            findNavController().navigateUp()
                        }
                        .addOnFailureListener { e ->
                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                } else {
                    // Update existing item quantity
                    val document = documents.documents.firstOrNull()
                    if (document != null) {
                        val currentQuantity = document.getLong("quantity")?.toInt() ?: 1
                        val newQuantity = currentQuantity + quantity
                        
                        document.reference.update(
                            mapOf(
                                "quantity" to newQuantity,
                                "totalPrice" to (food.price * newQuantity)
                            )
                        ).addOnSuccessListener {
                            Toast.makeText(context, "Cart updated successfully", Toast.LENGTH_SHORT).show()
                            findNavController().navigateUp()
                        }.addOnFailureListener { e ->
                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(context, "Error updating cart", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
