package com.komputerkit.wavesoffood.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.wavesoffood.model.CartItem
import com.komputerkit.wavesoffood.repository.CartRepository
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class CartViewModel(private val repository: CartRepository) : ViewModel() {
    private val _cartItems = MutableLiveData<List<CartItem>>()
    val cartItems: LiveData<List<CartItem>> = _cartItems

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _total = MutableLiveData<Double>()
    val total: LiveData<Double> = _total

    init {
        loadCartItems()
    }

    private fun loadCartItems() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            repository.getCartItems()
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { items ->
                    _cartItems.value = items
                    calculateTotal(items)
                    _isLoading.value = false
                }
        }
    }

    private fun calculateTotal(items: List<CartItem>) {
        val total = items.sumOf { item -> item.price * item.quantity }
        _total.value = total
    }

    fun addToCart(foodId: String, quantity: Int) {
        viewModelScope.launch {
            try {
                repository.addToCart(foodId, quantity)
                loadCartItems()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun updateQuantity(cartItemId: String, quantity: Int) {
        viewModelScope.launch {
            try {
                repository.updateCartItemQuantity(cartItemId, quantity)
                loadCartItems()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun removeFromCart(cartItemId: String) {
        viewModelScope.launch {
            try {
                repository.removeFromCart(cartItemId)
                loadCartItems()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun clearCart() {
        viewModelScope.launch {
            try {
                repository.clearCart()
                loadCartItems()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }
}
