package com.komputerkit.aplikasimonitoringkelas.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.aplikasimonitoringkelas.api.*
import com.komputerkit.aplikasimonitoringkelas.api.models.LoginRequest
import com.komputerkit.aplikasimonitoringkelas.api.models.LoginResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(context: Context) : ViewModel() {
    
    private val apiService = ApiClient.getApiService()
    private val tokenManager = TokenManager(context)
    
    private val _loginState = MutableStateFlow<ApiResult<LoginResponse>?>(null)
    val loginState: StateFlow<ApiResult<LoginResponse>?> = _loginState
    
    private val _isLoggedIn = MutableStateFlow(tokenManager.isLoggedIn())
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = ApiResult.Loading
            
            val result = ApiHelper.safeApiCall {
                apiService.login(LoginRequest(email, password))
            }
            
            when (result) {
                is ApiResult.Success -> {
                    // Simpan token dan user data dari struktur response yang baru
                    val loginData = result.data.data // data.data karena ada wrapper
                    tokenManager.saveToken(loginData.token)
                    tokenManager.saveUserData(
                        id = loginData.user.id,
                        name = loginData.user.name,
                        email = loginData.user.email,
                        role = loginData.user.role,
                        kelasId = loginData.user.kelas_id // Simpan kelas_id untuk siswa
                    )
                    _isLoggedIn.value = true
                }
                is ApiResult.Error -> {
                    // Error akan ditangani di UI
                }
                is ApiResult.Loading -> {}
            }
            
            _loginState.value = result
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            val token = tokenManager.getAuthHeader()
            if (token != null) {
                // Call logout API (optional)
                ApiHelper.safeApiCall {
                    apiService.logout(token)
                }
            }
            
            // Clear local data
            tokenManager.clearAll()
            _isLoggedIn.value = false
            _loginState.value = null
        }
    }
    
    fun getUserName(): String? = tokenManager.getUserName()
    
    fun getUserEmail(): String? = tokenManager.getUserEmail()
    
    fun getUserRole(): String? = tokenManager.getUserRole()
    
    fun getKelasId(): Int? = tokenManager.getKelasId()
}
