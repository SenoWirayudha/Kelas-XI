package com.komputerkit.easyshop.viewmodel

import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.easyshop.model.ProductModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * ViewModel untuk mengelola data produk dari Firestore
 */
class ProductViewModel : ViewModel() {
    
    private val firestore = FirebaseFirestore.getInstance()
    
    // State untuk list produk
    private val _products = MutableStateFlow<List<ProductModel>>(emptyList())
    val products: StateFlow<List<ProductModel>> = _products.asStateFlow()
    
    // State untuk produk yang sedang ditampilkan di detail
    private val _currentProduct = MutableStateFlow<ProductModel?>(null)
    val currentProduct: StateFlow<ProductModel?> = _currentProduct.asStateFlow()
    
    // State untuk loading
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    // State untuk error
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    // State untuk favorite products (simpan ID produk yang di-favorite)
    private val _favoriteProductIds = MutableStateFlow<Set<String>>(emptySet())
    val favoriteProductIds: StateFlow<Set<String>> = _favoriteProductIds.asStateFlow()
    
    /**
     * Ambil semua produk dari Firestore
     */
    fun getAllProducts() {
        _isLoading.value = true
        _error.value = null
        
        firestore.collection("products")
            .get()
            .addOnSuccessListener { result ->
                val productList = result.documents.mapNotNull { doc ->
                    doc.data?.let { ProductModel.fromMap(it) }
                }
                _products.value = productList
                _isLoading.value = false
            }
            .addOnFailureListener { exception ->
                _error.value = "Gagal memuat produk: ${exception.message}"
                _isLoading.value = false
            }
    }
    
    /**
     * Ambil produk berdasarkan kategori
     */
    fun getProductsByCategory(category: String) {
        _isLoading.value = true
        _error.value = null
        
        firestore.collection("products")
            .whereEqualTo("category", category)
            .get()
            .addOnSuccessListener { result ->
                val productList = result.documents.mapNotNull { doc ->
                    doc.data?.let { ProductModel.fromMap(it) }
                }
                _products.value = productList
                _isLoading.value = false
            }
            .addOnFailureListener { exception ->
                _error.value = "Gagal memuat produk: ${exception.message}"
                _isLoading.value = false
            }
    }
    
    /**
     * Ambil produk berdasarkan ID
     */
    fun getProductById(id: String) {
        _isLoading.value = true
        _error.value = null
        
        firestore.collection("products")
            .document(id)
            .get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    document.data?.let { data ->
                        _currentProduct.value = ProductModel.fromMap(data)
                    }
                } else {
                    _error.value = "Produk tidak ditemukan"
                }
                _isLoading.value = false
            }
            .addOnFailureListener { exception ->
                _error.value = "Gagal memuat detail produk: ${exception.message}"
                _isLoading.value = false
            }
    }
    
    /**
     * Toggle favorite status untuk produk
     */
    fun toggleFavorite(productId: String) {
        val currentFavorites = _favoriteProductIds.value.toMutableSet()
        if (currentFavorites.contains(productId)) {
            currentFavorites.remove(productId)
        } else {
            currentFavorites.add(productId)
        }
        _favoriteProductIds.value = currentFavorites
        
        // TODO: Simpan ke Firestore atau local storage untuk persistence
    }
    
    /**
     * Cek apakah produk sudah di-favorite
     */
    fun isFavorite(productId: String): Boolean {
        return _favoriteProductIds.value.contains(productId)
    }
    
    /**
     * Tambah produk ke keranjang
     * TODO: Implement cart functionality dengan CartViewModel
     */
    fun addToCart(product: ProductModel, quantity: Int = 1) {
        // Placeholder - akan diimplementasi dengan CartViewModel
        println("Added to cart: ${product.title} x $quantity")
    }
}
