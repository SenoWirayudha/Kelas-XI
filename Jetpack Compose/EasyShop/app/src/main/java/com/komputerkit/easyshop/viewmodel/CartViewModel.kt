package com.komputerkit.easyshop.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.easyshop.model.CartItem
import com.komputerkit.easyshop.model.ProductModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * ViewModel untuk mengelola keranjang belanja
 * Menyimpan cart items di Firestore untuk persistence
 */
class CartViewModel : ViewModel() {
    
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    // StateFlow untuk daftar cart items
    private val _cartItems = MutableStateFlow<List<CartItem>>(emptyList())
    val cartItems: StateFlow<List<CartItem>> = _cartItems
    
    // StateFlow untuk loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    // StateFlow untuk menandai sedang menambahkan item (prevent double click)
    private val _isAddingItem = MutableStateFlow(false)
    val isAddingItem: StateFlow<Boolean> = _isAddingItem
    
    // Computed property untuk total amount
    val totalAmount: StateFlow<Double> = _cartItems.map { items ->
        items.sumOf { it.getTotalPrice() }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0.0
    )
    
    // Computed property untuk total items count
    val totalItemsCount: StateFlow<Int> = _cartItems.map { items ->
        items.sumOf { it.quantity }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0
    )
    
    init {
        loadCart()
    }
    
    /**
     * Load cart dari Firestore
     */
    fun loadCart() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val userId = auth.currentUser?.uid
                if (userId != null) {
                    println("CartViewModel: Loading cart for user $userId")
                    
                    // Load cart items dari Firestore
                    val cartSnapshot = firestore.collection("users")
                        .document(userId)
                        .collection("cart")
                        .get()
                        .await()
                    
                    println("CartViewModel: Found ${cartSnapshot.documents.size} items in cart")
                    
                    val cartItems = mutableListOf<CartItem>()
                    
                    for (doc in cartSnapshot.documents) {
                        val productId = doc.data?.get("productId") as? String ?: continue
                        val quantity = (doc.data?.get("quantity") as? Number)?.toInt() ?: 1
                        
                        // Load product data
                        val productDoc = firestore.collection("products")
                            .document(productId)
                            .get()
                            .await()
                        
                        productDoc.data?.let { productData ->
                            val mutableData = productData.toMutableMap()
                            mutableData["id"] = productId
                            val product = ProductModel.fromMap(mutableData)
                            cartItems.add(CartItem(product, quantity))
                        }
                    }
                    
                    _cartItems.value = cartItems
                    println("CartViewModel: Cart loaded successfully with ${cartItems.size} items")
                    updateTotalAmount()
                } else {
                    println("CartViewModel: User not logged in, cannot load cart")
                }
            } catch (e: Exception) {
                println("CartViewModel ERROR loading cart: ${e.message}")
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Tambah item ke cart
     * Jika item sudah ada, tambah quantity
     */
    fun addItemToCart(product: ProductModel) {
        // Prevent double click
        if (_isAddingItem.value) {
            println("CartViewModel: Already adding item, ignoring duplicate call")
            return
        }
        
        viewModelScope.launch {
            _isAddingItem.value = true
            try {
                val userId = auth.currentUser?.uid
                if (userId == null) {
                    println("CartViewModel: User not logged in!")
                    return@launch
                }
                
                println("CartViewModel: Adding ${product.title} (ID: ${product.id}) to cart for user $userId")
                
                val currentItems = _cartItems.value.toMutableList()
                val existingItem = currentItems.find { it.product.id == product.id }
                
                if (existingItem != null) {
                    // Item sudah ada, tambah quantity
                    println("CartViewModel: Item already exists, increasing quantity from ${existingItem.quantity} to ${existingItem.quantity + 1}")
                    val newItem = existingItem.copy(quantity = existingItem.quantity + 1)
                    currentItems[currentItems.indexOf(existingItem)] = newItem
                    
                    // Update Firestore
                    firestore.collection("users")
                        .document(userId)
                        .collection("cart")
                        .document(product.id)
                        .set(newItem.toMap())
                        .await()
                } else {
                    // Item baru
                    println("CartViewModel: Adding new item to cart with quantity 1")
                    val newItem = CartItem(product, 1)
                    currentItems.add(newItem)
                    
                    // Save to Firestore
                    firestore.collection("users")
                        .document(userId)
                        .collection("cart")
                        .document(product.id)
                        .set(newItem.toMap())
                        .await()
                }
                
                _cartItems.value = currentItems
                updateTotalAmount()
                
                println("CartViewModel: Successfully added ${product.title} to cart. Total items: ${currentItems.size}")
            } catch (e: Exception) {
                println("CartViewModel ERROR: ${e.message}")
                e.printStackTrace()
            } finally {
                _isAddingItem.value = false
            }
        }
    }
    
    /**
     * Hapus item dari cart
     */
    fun removeItemFromCart(cartItem: CartItem) {
        viewModelScope.launch {
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                
                // Remove from Firestore
                firestore.collection("users")
                    .document(userId)
                    .collection("cart")
                    .document(cartItem.product.id)
                    .delete()
                    .await()
                
                // Remove from local state
                val currentItems = _cartItems.value.toMutableList()
                currentItems.remove(cartItem)
                _cartItems.value = currentItems
                updateTotalAmount()
                
                println("CartViewModel: Removed ${cartItem.product.title} from cart")
            } catch (e: Exception) {
                println("Error removing item from cart: ${e.message}")
            }
        }
    }
    
    /**
     * Tambah quantity item
     */
    fun increaseQuantity(cartItem: CartItem) {
        viewModelScope.launch {
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                
                val currentItems = _cartItems.value.toMutableList()
                val index = currentItems.indexOf(cartItem)
                
                if (index != -1) {
                    val newItem = cartItem.copy(quantity = cartItem.quantity + 1)
                    currentItems[index] = newItem
                    
                    // Update Firestore
                    firestore.collection("users")
                        .document(userId)
                        .collection("cart")
                        .document(cartItem.product.id)
                        .set(newItem.toMap())
                        .await()
                    
                    _cartItems.value = currentItems
                    updateTotalAmount()
                }
            } catch (e: Exception) {
                println("Error increasing quantity: ${e.message}")
            }
        }
    }
    
    /**
     * Kurangi quantity item
     * Jika quantity = 1, hapus item
     */
    fun decreaseQuantity(cartItem: CartItem) {
        viewModelScope.launch {
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                
                if (cartItem.quantity <= 1) {
                    // Hapus item jika quantity = 1
                    removeItemFromCart(cartItem)
                } else {
                    val currentItems = _cartItems.value.toMutableList()
                    val index = currentItems.indexOf(cartItem)
                    
                    if (index != -1) {
                        val newItem = cartItem.copy(quantity = cartItem.quantity - 1)
                        currentItems[index] = newItem
                        
                        // Update Firestore
                        firestore.collection("users")
                            .document(userId)
                            .collection("cart")
                            .document(cartItem.product.id)
                            .set(newItem.toMap())
                            .await()
                        
                        _cartItems.value = currentItems
                        updateTotalAmount()
                    }
                }
            } catch (e: Exception) {
                println("Error decreasing quantity: ${e.message}")
            }
        }
    }
    
    /**
     * Clear semua items dari cart
     */
    fun clearCart() {
        viewModelScope.launch {
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                
                // Delete all cart items from Firestore
                val cartSnapshot = firestore.collection("users")
                    .document(userId)
                    .collection("cart")
                    .get()
                    .await()
                
                for (doc in cartSnapshot.documents) {
                    doc.reference.delete().await()
                }
                
                _cartItems.value = emptyList()
                updateTotalAmount()
                
                println("CartViewModel: Cart cleared")
            } catch (e: Exception) {
                println("Error clearing cart: ${e.message}")
            }
        }
    }
    
    /**
     * Update total amount calculation
     */
    private fun updateTotalAmount() {
        val total = _cartItems.value.sumOf { it.getTotalPrice() }
        (totalAmount as MutableStateFlow).value = total
        
        val count = _cartItems.value.sumOf { it.quantity }
        (totalItemsCount as MutableStateFlow).value = count
    }
}
