package com.komputerkit.blogapp.viewmodel

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.komputerkit.blogapp.data.User
import com.komputerkit.blogapp.repository.AuthRepository
import com.komputerkit.blogapp.repository.BlogRepository
import com.komputerkit.blogapp.utils.SingleLiveEvent
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {
    private val repository = AuthRepository()
    private val blogRepository = BlogRepository()

    private val _authState = MutableLiveData<FirebaseUser?>()
    val authState: LiveData<FirebaseUser?> = _authState

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _userData = MutableLiveData<User?>()
    val userData: LiveData<User?> = _userData

    private val _profileUpdateSuccess = MutableLiveData<Boolean>()
    val profileUpdateSuccess: LiveData<Boolean> = _profileUpdateSuccess

    init {
        repository.getAuthStateFlow()
            .onEach { user ->
                _authState.value = user
                if (user != null) {
                    loadUserData(user.uid)
                }
            }
            .launchIn(viewModelScope)
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            
            repository.signIn(email, password)
                .onSuccess { user ->
                    _authState.value = user
                }
                .onFailure { exception ->
                    _error.value = exception.message
                }
            
            _loading.value = false
        }
    }

    fun signUp(email: String, password: String, displayName: String) {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            
            Log.d("AuthViewModel", "=== STARTING REGISTRATION ===")
            Log.d("AuthViewModel", "Email: $email, DisplayName: $displayName")
            
            repository.signUp(email, password, displayName)
                .onSuccess { user ->
                    Log.d("AuthViewModel", "✅ Registration successful for user: ${user.uid}")
                    
                    // Verify user document was created
                    viewModelScope.launch {
                        kotlinx.coroutines.delay(2000) // Wait for Firestore operations
                        Log.d("AuthViewModel", "Verifying user document creation...")
                        repository.getUserData(user.uid)
                            .onSuccess { userData ->
                                Log.d("AuthViewModel", "✅ User document verified: ${userData.displayName}")
                                _authState.value = user
                            }
                            .onFailure { 
                                Log.e("AuthViewModel", "❌ User document not found, but continuing with auth")
                                _authState.value = user // Still set auth state even if document check fails
                            }
                    }
                }
                .onFailure { exception ->
                    Log.e("AuthViewModel", "❌ Registration failed", exception)
                    _error.value = exception.message
                }
            
            _loading.value = false
        }
    }

    fun signOut() {
        repository.signOut()
        _userData.value = null
    }

    fun loadUserData(userId: String) {
        viewModelScope.launch {
            Log.d("AuthViewModel", "=== LOADING USER DATA ===")
            Log.d("AuthViewModel", "User ID: $userId")
            
            repository.getUserData(userId)
                .onSuccess { user ->
                    Log.d("AuthViewModel", "✅ User data loaded successfully: ${user.displayName} (${user.email})")
                    _userData.value = user
                }
                .onFailure { exception ->
                    Log.e("AuthViewModel", "❌ Failed to load user data", exception)
                    _error.value = exception.message
                    
                    // If user not found, try to get current user info and create document
                    if (exception.message?.contains("User not found") == true) {
                        Log.d("AuthViewModel", "User document not found, attempting to create...")
                        val currentUser = repository.getCurrentUser()
                        currentUser?.let { firebaseUser ->
                            val email = firebaseUser.email ?: ""
                            val displayName = firebaseUser.displayName ?: email.substringBefore("@").ifEmpty { "User" }
                            createMissingUserDocument(email, displayName)
                        }
                    }
                }
        }
    }

    fun createMissingUserDocument(email: String, displayName: String) {
        viewModelScope.launch {
            val currentUser = repository.getCurrentUser()
            currentUser?.let { user ->
                Log.d("AuthViewModel", "=== CREATING MISSING USER DOCUMENT ===")
                Log.d("AuthViewModel", "User ID: ${user.uid}, Email: $email, DisplayName: $displayName")
                
                repository.createMissingUserDocument(user.uid, email, displayName)
                    .onSuccess {
                        Log.d("AuthViewModel", "✅ Missing user document created successfully")
                        // Immediately reload user data
                        loadUserData(user.uid)
                    }
                    .onFailure { exception ->
                        Log.e("AuthViewModel", "❌ Failed to create missing user document", exception)
                        _error.value = exception.message
                    }
            }
        }
    }

    fun clearError() {
        _error.value = null
    }

    fun updateProfilePhoto(base64Image: String) {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            
            Log.d("AuthViewModel", "Updating profile photo, base64 length: ${base64Image.length}")
            
            val currentUser = repository.getCurrentUser()
            if (currentUser != null) {
                Log.d("AuthViewModel", "Current user found: ${currentUser.uid}")
                repository.updateProfilePhoto(currentUser.uid, base64Image)
                    .onSuccess {
                        Log.d("AuthViewModel", "Profile photo updated successfully")
                        
                        // Get current user data to update blog posts
                        repository.getUserData(currentUser.uid)
                            .onSuccess { userData ->
                                Log.d("AuthViewModel", "Got user data for blog posts update: ${userData.displayName}")
                                // Update all user's blog posts with new profile image
                                blogRepository.updateUserPostsProfile(
                                    currentUser.uid, 
                                    userData.displayName, 
                                    base64Image
                                ).onSuccess {
                                    Log.d("AuthViewModel", "✅ All blog posts updated with new profile photo")
                                }.onFailure { exception ->
                                    Log.e("AuthViewModel", "❌ Failed to update blog posts with new profile photo", exception)
                                }
                            }
                            .onFailure { exception ->
                                Log.e("AuthViewModel", "Failed to get user data for blog posts update", exception)
                            }
                        
                        _profileUpdateSuccess.value = true
                        // Reload user data to get updated profile
                        loadUserData(currentUser.uid)
                    }
                    .onFailure { exception ->
                        Log.e("AuthViewModel", "Failed to update profile photo", exception)
                        _error.value = exception.message
                    }
            } else {
                Log.e("AuthViewModel", "No current user found")
                _error.value = "User not logged in"
            }
            
            _loading.value = false
        }
    }

    fun updateUserProfile(displayName: String, profileImageBase64: String = "") {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            
            val currentUser = repository.getCurrentUser()
            if (currentUser != null) {
                repository.updateUserProfile(currentUser.uid, displayName, profileImageBase64)
                    .onSuccess {
                        Log.d("AuthViewModel", "User profile updated successfully")
                        
                        // Update all user's blog posts with new profile information
                        val finalProfileImage = if (profileImageBase64.isNotEmpty()) {
                            profileImageBase64
                        } else {
                            // Get current profile image if none provided
                            repository.getUserData(currentUser.uid)
                                .getOrNull()?.profileImageBase64 ?: ""
                        }
                        
                        blogRepository.updateUserPostsProfile(
                            currentUser.uid, 
                            displayName, 
                            finalProfileImage
                        ).onSuccess {
                            Log.d("AuthViewModel", "✅ All blog posts updated with new profile")
                        }.onFailure { exception ->
                            Log.e("AuthViewModel", "❌ Failed to update blog posts with new profile", exception)
                        }
                        
                        _profileUpdateSuccess.value = true
                        // Reload user data to get updated profile
                        loadUserData(currentUser.uid)
                    }
                    .onFailure { exception ->
                        _error.value = exception.message
                    }
            } else {
                _error.value = "User not logged in"
            }
            
            _loading.value = false
        }
    }

    fun clearProfileUpdateSuccess() {
        _profileUpdateSuccess.value = false
    }

    fun updateDisplayName(newDisplayName: String) {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            
            Log.d("AuthViewModel", "Updating display name to: $newDisplayName")
            
            val currentUser = repository.getCurrentUser()
            if (currentUser != null) {
                Log.d("AuthViewModel", "Current user found: ${currentUser.uid}")
                repository.updateUserProfile(currentUser.uid, newDisplayName)
                    .onSuccess {
                        Log.d("AuthViewModel", "Display name updated successfully")
                        
                        // Get current user data to update blog posts
                        repository.getUserData(currentUser.uid)
                            .onSuccess { userData ->
                                Log.d("AuthViewModel", "Got user data for blog posts update with profile image length: ${userData.profileImageBase64.length}")
                                // Update all user's blog posts with new display name and existing profile image
                                blogRepository.updateUserPostsProfile(
                                    currentUser.uid, 
                                    newDisplayName, 
                                    userData.profileImageBase64
                                ).onSuccess {
                                    Log.d("AuthViewModel", "✅ All blog posts updated with new display name")
                                }.onFailure { exception ->
                                    Log.e("AuthViewModel", "❌ Failed to update blog posts with new display name", exception)
                                }
                            }
                            .onFailure { exception ->
                                Log.e("AuthViewModel", "Failed to get user data for blog posts update", exception)
                            }
                        
                        _profileUpdateSuccess.value = true
                        // Reload user data to get updated profile
                        loadUserData(currentUser.uid)
                    }
                    .onFailure { exception ->
                        Log.e("AuthViewModel", "Failed to update display name", exception)
                        _error.value = exception.message
                    }
            } else {
                Log.e("AuthViewModel", "No current user found")
                _error.value = "User not logged in"
            }
            
            _loading.value = false
        }
    }

    fun isUserLoggedIn(): Boolean = repository.isUserLoggedIn()
}
