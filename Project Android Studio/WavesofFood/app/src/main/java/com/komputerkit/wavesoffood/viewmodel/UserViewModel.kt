package com.komputerkit.wavesoffood.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.wavesoffood.model.User
import com.komputerkit.wavesoffood.model.Address
import com.komputerkit.wavesoffood.repository.UserRepository
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class UserViewModel(private val repository: UserRepository) : ViewModel() {
    private val _user = MutableLiveData<User?>()
    val user: LiveData<User?> = _user

    private val _addresses = MutableLiveData<List<Address>>()
    val addresses: LiveData<List<Address>> = _addresses

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    init {
        if (repository.isUserLoggedIn()) {
            loadUserProfile()
            loadAddresses()
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            repository.login(email, password)
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { resource ->
                    when (resource) {
                        is com.komputerkit.wavesoffood.data.Resource.Loading -> {
                            _isLoading.value = true
                            _error.value = null
                        }
                        is com.komputerkit.wavesoffood.data.Resource.Success -> {
                            _isLoading.value = false
                            _user.value = resource.data
                            loadAddresses()
                        }
                        is com.komputerkit.wavesoffood.data.Resource.Error -> {
                            _isLoading.value = false
                            _error.value = resource.message
                        }
                    }
                }
        }
    }

    fun register(email: String, password: String, name: String, phone: String = "") {
        viewModelScope.launch {
            repository.register(email, password, name, phone)
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { resource ->
                    when (resource) {
                        is com.komputerkit.wavesoffood.data.Resource.Loading -> {
                            _isLoading.value = true
                            _error.value = null
                        }
                        is com.komputerkit.wavesoffood.data.Resource.Success -> {
                            _isLoading.value = false
                            _user.value = resource.data
                        }
                        is com.komputerkit.wavesoffood.data.Resource.Error -> {
                            _isLoading.value = false
                            _error.value = resource.message
                        }
                    }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout().collect { resource ->
                when (resource) {
                    is com.komputerkit.wavesoffood.data.Resource.Success -> {
                        _user.value = null
                        _addresses.value = emptyList()
                    }
                    is com.komputerkit.wavesoffood.data.Resource.Error -> {
                        _error.value = resource.message
                    }
                    is com.komputerkit.wavesoffood.data.Resource.Loading -> {
                        // Handle loading if needed
                    }
                }
            }
        }
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            repository.getUserProfile()
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { userProfile ->
                    _user.value = userProfile
                    _isLoading.value = false
                }
        }
    }

    private fun loadAddresses() {
        viewModelScope.launch {
            repository.getUserAddresses()
                .catch { e ->
                    _error.value = e.message
                }
                .collect { addressList ->
                    _addresses.value = addressList
                }
        }
    }

    fun updateProfile(name: String, phone: String, email: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                val user = com.komputerkit.wavesoffood.model.User(
                    name = name,
                    phone = phone,
                    email = email
                )
                repository.updateUserProfile(user)
                loadUserProfile()
            } catch (e: Exception) {
                _error.value = e.message
                _isLoading.value = false
            }
        }
    }

    fun addAddress(address: Address) {
        viewModelScope.launch {
            try {
                repository.addAddress(address)
                loadAddresses()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun updateAddress(addressId: String, address: Address) {
        viewModelScope.launch {
            try {
                repository.updateAddress(addressId, address)
                loadAddresses()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun deleteAddress(addressId: String) {
        viewModelScope.launch {
            try {
                repository.deleteAddress(addressId)
                loadAddresses()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }
}
