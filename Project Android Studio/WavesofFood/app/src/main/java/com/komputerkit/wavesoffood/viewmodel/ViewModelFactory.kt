package com.komputerkit.wavesoffood.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.komputerkit.wavesoffood.repository.CartRepository
import com.komputerkit.wavesoffood.repository.FoodRepository
import com.komputerkit.wavesoffood.repository.OrderRepository
import com.komputerkit.wavesoffood.repository.UserRepository

class ViewModelFactory(
    private val foodRepository: FoodRepository? = null,
    private val cartRepository: CartRepository? = null,
    private val orderRepository: OrderRepository? = null,
    private val userRepository: UserRepository? = null
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(FoodViewModel::class.java) -> {
                requireNotNull(foodRepository) { "FoodRepository is required for FoodViewModel" }
                FoodViewModel(foodRepository) as T
            }
            modelClass.isAssignableFrom(CartViewModel::class.java) -> {
                requireNotNull(cartRepository) { "CartRepository is required for CartViewModel" }
                CartViewModel(cartRepository) as T
            }
            modelClass.isAssignableFrom(OrderViewModel::class.java) -> {
                requireNotNull(orderRepository) { "OrderRepository is required for OrderViewModel" }
                OrderViewModel(orderRepository) as T
            }
            modelClass.isAssignableFrom(UserViewModel::class.java) -> {
                requireNotNull(userRepository) { "UserRepository is required for UserViewModel" }
                UserViewModel(userRepository) as T
            }
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
