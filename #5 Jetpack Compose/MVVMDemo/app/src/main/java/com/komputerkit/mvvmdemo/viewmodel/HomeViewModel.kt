package com.komputerkit.mvvmdemo.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.mvvmdemo.model.User
import com.komputerkit.mvvmdemo.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for the Home screen
 * Manages UI state and business logic for user data
 */
class HomeViewModel : ViewModel() {
    
    private val userRepository = UserRepository()
    
    // MutableStateFlow for user data
    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()
    
    // MutableStateFlow for loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    /**
     * Loads user data from the repository
     * Sets loading state and updates user data when completed
     */
    fun loadUserData() {
        viewModelScope.launch {
            try {
                // Set loading to true
                _isLoading.value = true
                
                // Fetch user data from repository
                val userData = userRepository.fetchUser()
                
                // Update user data
                _user.value = userData
                
            } catch (e: Exception) {
                // Handle error (you can add error state if needed)
                // For now, we'll just log or handle as needed
                _user.value = null
            } finally {
                // Set loading to false
                _isLoading.value = false
            }
        }
    }
}