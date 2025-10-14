package com.komputerkit.easyshop.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.easyshop.model.ProductModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * ViewModel untuk mengelola daftar produk favorite
 * Menyimpan favorite di Firestore untuk sinkronisasi antar device
 */
class FavoriteViewModel(application: Application) : AndroidViewModel(application) {
    
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    // StateFlow untuk daftar favorite product IDs
    private val _favoriteIds = MutableStateFlow<Set<String>>(emptySet())
    val favoriteIds: StateFlow<Set<String>> = _favoriteIds
    
    // StateFlow untuk daftar favorite products (full object)
    private val _favoriteProducts = MutableStateFlow<List<ProductModel>>(emptyList())
    val favoriteProducts: StateFlow<List<ProductModel>> = _favoriteProducts
    
    // Loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    init {
        loadFavorites()
    }
    
    /**
     * Load daftar favorite dari Firestore
     */
    fun loadFavorites() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val userId = auth.currentUser?.uid
                if (userId != null) {
                    // Load favorite IDs dari Firestore
                    val favoritesDoc = firestore.collection("users")
                        .document(userId)
                        .collection("favorites")
                        .get()
                        .await()
                    
                    val favoriteIdsList = favoritesDoc.documents.map { it.id }
                    _favoriteIds.value = favoriteIdsList.toSet()
                    
                    // Load full product data untuk setiap favorite
                    if (favoriteIdsList.isNotEmpty()) {
                        loadFavoriteProducts(favoriteIdsList)
                    } else {
                        _favoriteProducts.value = emptyList()
                    }
                }
            } catch (e: Exception) {
                println("Error loading favorites: ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Load full product data untuk favorite products
     */
    private suspend fun loadFavoriteProducts(productIds: List<String>) {
        try {
            val products = mutableListOf<ProductModel>()
            
            // Batch load products (max 10 per query di Firestore)
            productIds.chunked(10).forEach { chunk ->
                val productsSnapshot = firestore.collection("products")
                    .whereIn("id", chunk)
                    .get()
                    .await()
                
                productsSnapshot.documents.mapNotNullTo(products) { doc ->
                    doc.data?.let { ProductModel.fromMap(it) }
                }
            }
            
            _favoriteProducts.value = products
        } catch (e: Exception) {
            println("Error loading favorite products: ${e.message}")
        }
    }
    
    /**
     * Toggle favorite status untuk sebuah produk
     */
    fun toggleFavorite(productId: String) {
        viewModelScope.launch {
            val userId = auth.currentUser?.uid ?: return@launch
            
            try {
                val isFavorite = _favoriteIds.value.contains(productId)
                val favoriteRef = firestore.collection("users")
                    .document(userId)
                    .collection("favorites")
                    .document(productId)
                
                if (isFavorite) {
                    // Remove from favorites
                    favoriteRef.delete().await()
                    _favoriteIds.value = _favoriteIds.value - productId
                    _favoriteProducts.value = _favoriteProducts.value.filter { it.id != productId }
                } else {
                    // Add to favorites
                    favoriteRef.set(mapOf(
                        "productId" to productId,
                        "timestamp" to System.currentTimeMillis()
                    )).await()
                    _favoriteIds.value = _favoriteIds.value + productId
                    
                    // Load the product data and add to list
                    val productDoc = firestore.collection("products")
                        .document(productId)
                        .get()
                        .await()
                    
                    productDoc.data?.let { data ->
                        val product = ProductModel.fromMap(data)
                        _favoriteProducts.value = _favoriteProducts.value + product
                    }
                }
            } catch (e: Exception) {
                println("Error toggling favorite: ${e.message}")
            }
        }
    }
    
    /**
     * Cek apakah produk adalah favorite
     */
    fun isFavorite(productId: String): Boolean {
        return _favoriteIds.value.contains(productId)
    }
    
    /**
     * Clear semua favorites (untuk testing/logout)
     */
    fun clearFavorites() {
        viewModelScope.launch {
            val userId = auth.currentUser?.uid ?: return@launch
            
            try {
                val favoritesSnapshot = firestore.collection("users")
                    .document(userId)
                    .collection("favorites")
                    .get()
                    .await()
                
                favoritesSnapshot.documents.forEach { doc ->
                    doc.reference.delete().await()
                }
                
                _favoriteIds.value = emptySet()
                _favoriteProducts.value = emptyList()
            } catch (e: Exception) {
                println("Error clearing favorites: ${e.message}")
            }
        }
    }
}
