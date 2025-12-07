package com.komputerkit.wavesoffood.ui.home

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.widget.SearchView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.model.Food
import com.komputerkit.wavesoffood.databinding.FragmentHomeBinding

class HomeFragment : Fragment() {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private lateinit var popularAdapter: FoodAdapter
    private lateinit var allMenuAdapter: FoodAdapter
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerViews()
        setupSearchView()
        setupChipGroup()
        loadFoodData()
    }

    private fun setupRecyclerViews() {
        popularAdapter = FoodAdapter(
            onItemClick = { food -> navigateToFoodDetail(food) },
            onAddToCartClick = { food -> addToCart(food) }
        )
        
        allMenuAdapter = FoodAdapter(
            onItemClick = { food -> navigateToFoodDetail(food) },
            onAddToCartClick = { food -> addToCart(food) }
        )

        binding.rvPopular.apply {
            layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
            adapter = popularAdapter
        }

        binding.rvAllMenu.apply {
            layoutManager = GridLayoutManager(context, 2)
            adapter = allMenuAdapter
        }
    }

    private fun setupSearchView() {
        binding.searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?): Boolean {
                return false
            }

            override fun onQueryTextChange(newText: String?): Boolean {
                filterFoodList(newText)
                return true
            }
        })
    }

    private fun setupChipGroup() {
        // Set default selection to "Semua"
        binding.chipAll.isChecked = true
        
        // Set click listeners for each chip
        binding.chipAll.setOnClickListener {
            clearAllChips()
            binding.chipAll.isChecked = true
            filterByCategory("")
        }
        
        binding.chipAyam.setOnClickListener {
            clearAllChips()
            binding.chipAyam.isChecked = true
            filterByCategory("ayam")
        }
        
        binding.chipDaging.setOnClickListener {
            clearAllChips()
            binding.chipDaging.isChecked = true
            filterByCategory("daging")
        }
        
        binding.chipMie.setOnClickListener {
            clearAllChips()
            binding.chipMie.isChecked = true
            filterByCategory("mie")
        }
        
        binding.chipMinuman.setOnClickListener {
            clearAllChips()
            binding.chipMinuman.isChecked = true
            filterByCategory("minuman")
        }
        
        binding.chipNasi.setOnClickListener {
            clearAllChips()
            binding.chipNasi.isChecked = true
            filterByCategory("nasi")
        }
        
        binding.chipSate.setOnClickListener {
            clearAllChips()
            binding.chipSate.isChecked = true
            filterByCategory("sate")
        }
        
        binding.chipSayuran.setOnClickListener {
            clearAllChips()
            binding.chipSayuran.isChecked = true
            filterByCategory("sayuran")
        }
        
        binding.chipSeafood.setOnClickListener {
            clearAllChips()
            binding.chipSeafood.isChecked = true
            filterByCategory("seafood")
        }
        
        binding.chipDessert.setOnClickListener {
            clearAllChips()
            binding.chipDessert.isChecked = true
            filterByCategory("dessert")
        }
    }
    
    private fun clearAllChips() {
        binding.chipAll.isChecked = false
        binding.chipAyam.isChecked = false
        binding.chipDaging.isChecked = false
        binding.chipMie.isChecked = false
        binding.chipMinuman.isChecked = false
        binding.chipNasi.isChecked = false
        binding.chipSate.isChecked = false
        binding.chipSayuran.isChecked = false
        binding.chipSeafood.isChecked = false
        binding.chipDessert.isChecked = false
    }

    private fun loadFoodData() {
        db.collection("foods")
            .get()
            .addOnSuccessListener { result ->
                val foodList = result.documents.mapNotNull { doc ->
                    try {
                        val food = doc.toObject(Food::class.java)?.copy(id = doc.id)
                        val isAvailable = doc.getBoolean("isAvailable") ?: true
                        val updatedFood = food?.copy(isAvailable = isAvailable)
                        Log.d("HomeFragment", "Loaded food: ${updatedFood?.name}, isAvailable from doc: ${doc.getBoolean("isAvailable")}, final isAvailable: ${updatedFood?.isAvailable}")
                        updatedFood
                    } catch (e: Exception) {
                        Log.e("HomeFragment", "Error parsing food document: ${e.message}")
                        null
                    }
                }
                
                val popularFood = foodList.sortedByDescending { it.rating }.take(5)
                popularAdapter.submitList(popularFood)
                allMenuAdapter.submitList(foodList)
                
                Log.d("HomeFragment", "Total foods loaded: ${foodList.size}")
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun filterFoodList(query: String?) {
        if (query.isNullOrBlank()) {
            loadFoodData()
            return
        }

        db.collection("foods")
            .get()
            .addOnSuccessListener { result ->
                val foodList = result.documents.mapNotNull { doc ->
                    try {
                        val food = doc.toObject(Food::class.java)?.copy(id = doc.id)
                        val isAvailable = doc.getBoolean("isAvailable") ?: true
                        food?.copy(isAvailable = isAvailable)
                    } catch (e: Exception) {
                        Log.e("HomeFragment", "Error parsing food document in search: ${e.message}")
                        null
                    }
                }.filter { food ->
                    food.name.contains(query, ignoreCase = true) ||
                    food.description.contains(query, ignoreCase = true)
                }
                
                allMenuAdapter.submitList(foodList)
            }
    }

    private fun filterByCategory(category: String) {
        if (category.isEmpty()) {
            loadFoodData()
            return
        }

        // Map lowercase category to proper case for Firestore query
        val firestoreCategory = when (category.lowercase()) {
            "ayam" -> "Ayam"
            "daging" -> "Daging"
            "mie" -> "Mie"
            "minuman" -> "Minuman"
            "nasi" -> "Nasi"
            "sate" -> "Sate"
            "sayuran" -> "Sayuran"
            "seafood" -> "Seafood"
            "dessert" -> "Dessert"
            else -> category
        }

        // First try exact category match from Firestore
        db.collection("foods")
            .whereEqualTo("category", firestoreCategory)
            .get()
            .addOnSuccessListener { result ->
                val foodList = result.documents.mapNotNull { doc ->
                    try {
                        val food = doc.toObject(Food::class.java)?.copy(id = doc.id)
                        val isAvailable = doc.getBoolean("isAvailable") ?: true
                        food?.copy(isAvailable = isAvailable)
                    } catch (e: Exception) {
                        Log.e("HomeFragment", "Error parsing food document in category filter: ${e.message}")
                        null
                    }
                }
                
                if (foodList.isNotEmpty()) {
                    // Found items with exact category match
                    allMenuAdapter.submitList(foodList)
                } else {
                    // Fallback to name/description search if no exact category match
                    searchByNameAndDescription(category)
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Error filtering by category: ${e.message}", Toast.LENGTH_SHORT).show()
                // Fallback to name/description search on error
                searchByNameAndDescription(category)
            }
    }

    private fun searchByNameAndDescription(category: String) {
        db.collection("foods")
            .get()
            .addOnSuccessListener { result ->
                val allFoods = result.documents.mapNotNull { doc ->
                    try {
                        val food = doc.toObject(Food::class.java)?.copy(id = doc.id)
                        val isAvailable = doc.getBoolean("isAvailable") ?: true
                        food?.copy(isAvailable = isAvailable)
                    } catch (e: Exception) {
                        Log.e("HomeFragment", "Error parsing food document in name search: ${e.message}")
                        null
                    }
                }
                
                val filteredList = when (category.lowercase()) {
                    "ayam" -> allFoods.filter { food ->
                        food.name.contains("ayam", ignoreCase = true) ||
                        food.name.contains("chicken", ignoreCase = true) ||
                        food.description.contains("ayam", ignoreCase = true) ||
                        food.description.contains("chicken", ignoreCase = true)
                    }
                    "daging" -> allFoods.filter { food ->
                        food.name.contains("daging", ignoreCase = true) ||
                        food.name.contains("beef", ignoreCase = true) ||
                        food.name.contains("sapi", ignoreCase = true) ||
                        food.description.contains("daging", ignoreCase = true) ||
                        food.description.contains("beef", ignoreCase = true)
                    }
                    "mie" -> allFoods.filter { food ->
                        food.name.contains("mie", ignoreCase = true) ||
                        food.name.contains("noodle", ignoreCase = true) ||
                        food.name.contains("bakmi", ignoreCase = true) ||
                        food.description.contains("mie", ignoreCase = true) ||
                        food.description.contains("noodle", ignoreCase = true)
                    }
                    "minuman" -> allFoods.filter { food ->
                        food.name.contains("minuman", ignoreCase = true) ||
                        food.name.contains("drink", ignoreCase = true) ||
                        food.name.contains("juice", ignoreCase = true) ||
                        food.name.contains("es", ignoreCase = true) ||
                        food.description.contains("minuman", ignoreCase = true) ||
                        food.description.contains("drink", ignoreCase = true)
                    }
                    "nasi" -> allFoods.filter { food ->
                        food.name.contains("nasi", ignoreCase = true) ||
                        food.name.contains("rice", ignoreCase = true) ||
                        food.description.contains("nasi", ignoreCase = true) ||
                        food.description.contains("rice", ignoreCase = true)
                    }
                    "sate" -> allFoods.filter { food ->
                        food.name.contains("sate", ignoreCase = true) ||
                        food.name.contains("satay", ignoreCase = true) ||
                        food.description.contains("sate", ignoreCase = true) ||
                        food.description.contains("satay", ignoreCase = true)
                    }
                    "sayuran" -> allFoods.filter { food ->
                        food.name.contains("sayur", ignoreCase = true) ||
                        food.name.contains("vegetable", ignoreCase = true) ||
                        food.name.contains("salad", ignoreCase = true) ||
                        food.description.contains("sayur", ignoreCase = true) ||
                        food.description.contains("vegetable", ignoreCase = true)
                    }
                    "seafood" -> allFoods.filter { food ->
                        food.name.contains("seafood", ignoreCase = true) ||
                        food.name.contains("ikan", ignoreCase = true) ||
                        food.name.contains("fish", ignoreCase = true) ||
                        food.name.contains("udang", ignoreCase = true) ||
                        food.name.contains("shrimp", ignoreCase = true) ||
                        food.name.contains("cumi", ignoreCase = true) ||
                        food.description.contains("seafood", ignoreCase = true) ||
                        food.description.contains("ikan", ignoreCase = true)
                    }
                    "dessert" -> allFoods.filter { food ->
                        food.name.contains("dessert", ignoreCase = true) ||
                        food.name.contains("sweet", ignoreCase = true) ||
                        food.name.contains("cake", ignoreCase = true) ||
                        food.name.contains("ice cream", ignoreCase = true) ||
                        food.name.contains("es krim", ignoreCase = true) ||
                        food.description.contains("dessert", ignoreCase = true) ||
                        food.description.contains("sweet", ignoreCase = true)
                    }
                    else -> allFoods
                }
                
                allMenuAdapter.submitList(filteredList)
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Error searching by name: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun navigateToFoodDetail(food: Food) {
        if (!food.isAvailable) {
            Toast.makeText(context, "Menu tidak tersedia saat ini", Toast.LENGTH_SHORT).show()
            return
        }
        
        val action = HomeFragmentDirections.actionNavigationHomeToFoodDetailFragment(food)
        findNavController().navigate(action)
    }

    private fun addToCart(food: Food) {
        if (!food.isAvailable) {
            Toast.makeText(context, "Menu tidak tersedia saat ini", Toast.LENGTH_SHORT).show()
            return
        }
        
        val userId = auth.currentUser?.uid
        if (userId == null) {
            Toast.makeText(context, "Please login to add items to cart", Toast.LENGTH_SHORT).show()
            return
        }

        // Validate food object
        if (food.id.isEmpty() || food.name.isEmpty()) {
            Toast.makeText(context, "Invalid food item", Toast.LENGTH_SHORT).show()
            return
        }

        val cartItem = hashMapOf(
            "foodId" to food.id,
            "name" to food.name,
            "price" to food.price,
            "quantity" to 1,
            "imageUrl" to food.imageUrl,
            "totalPrice" to food.price
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
                            Toast.makeText(context, "Added to cart successfully", Toast.LENGTH_SHORT).show()
                        }
                        .addOnFailureListener { e ->
                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                } else {
                    // Update existing item quantity
                    val document = documents.documents.firstOrNull()
                    if (document != null) {
                        val currentQuantity = document.getLong("quantity")?.toInt() ?: 1
                        val newQuantity = currentQuantity + 1
                        
                        document.reference.update(
                            mapOf(
                                "quantity" to newQuantity,
                                "totalPrice" to (food.price * newQuantity)
                            )
                        ).addOnSuccessListener {
                            Toast.makeText(context, "Cart updated successfully", Toast.LENGTH_SHORT).show()
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
