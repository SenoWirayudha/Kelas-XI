package com.komputerkit.wavesoffood.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.wavesoffood.model.Order
import com.komputerkit.wavesoffood.repository.OrderRepository
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class OrderViewModel(private val repository: OrderRepository) : ViewModel() {
    private val _orders = MutableLiveData<List<Order>>()
    val orders: LiveData<List<Order>> = _orders

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    init {
        loadOrders()
    }

    fun loadOrders() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            repository.getUserOrders()
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { orderList ->
                    _orders.value = orderList
                    _isLoading.value = false
                }
        }
    }

    fun placeOrder(order: com.komputerkit.wavesoffood.model.Order) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                repository.placeOrder(order)
                loadOrders()
            } catch (e: Exception) {
                _error.value = e.message
                _isLoading.value = false
            }
        }
    }

    fun getOrderById(orderId: String): LiveData<Order?> {
        val result = MutableLiveData<Order?>()
        viewModelScope.launch {
            repository.getOrderById(orderId)
                .catch { e ->
                    _error.value = e.message
                }
                .collect { order ->
                    result.value = order
                }
        }
        return result
    }

    // Admin only functions
    fun getAllOrders() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            repository.getAllOrders()
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { orderList ->
                    _orders.value = orderList
                    _isLoading.value = false
                }
        }
    }

    fun updateOrderStatus(orderId: String, status: com.komputerkit.wavesoffood.model.Status) {
        viewModelScope.launch {
            try {
                repository.updateOrderStatus(orderId, status)
                loadOrders()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }
}
