package com.komputerkit.socialmediaapp.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.repository.FirebaseRepository

/**
 * UserViewModel untuk mengelola data user dengan realtime updates
 * - Menggunakan Firestore snapshot listener untuk realtime updates
 * - Menyediakan LiveData untuk UI components
 * - Mengelola user cache untuk optimasi performance
 * - Auto refresh semua UI yang menggunakan user data
 */
class UserViewModel : ViewModel() {
    
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val repository = FirebaseRepository()
    
    // LiveData untuk current user
    private val _currentUser = MutableLiveData<User?>()
    val currentUser: LiveData<User?> = _currentUser
    
    // LiveData untuk loading state
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    // LiveData untuk error messages
    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage
    
    // LiveData untuk update success
    private val _updateSuccess = MutableLiveData<Boolean>()
    val updateSuccess: LiveData<Boolean> = _updateSuccess
    
    // Cache untuk user data (userId -> User)
    private val userCache = mutableMapOf<String, User>()
    
    // Listener registrations
    private var currentUserListener: ListenerRegistration? = null
    private val userListeners = mutableMapOf<String, ListenerRegistration>()
    
    init {
        startListeningToCurrentUser()
    }
    
    /**
     * Start listening to current user data
     */
    private fun startListeningToCurrentUser() {
        val currentUserId = auth.currentUser?.uid
        if (currentUserId != null) {
            _isLoading.value = true
            
            currentUserListener = firestore.collection("users")
                .document(currentUserId)
                .addSnapshotListener { snapshot, error ->
                    _isLoading.value = false
                    
                    if (error != null) {
                        _errorMessage.value = "Error loading user data: ${error.message}"
                        return@addSnapshotListener
                    }
                    
                    if (snapshot?.exists() == true) {
                        val user = snapshot.toObject(User::class.java)?.copy(id = snapshot.id)
                        _currentUser.value = user
                        
                        // Update cache
                        if (user != null) {
                            userCache[currentUserId] = user
                        }
                    } else {
                        _currentUser.value = null
                    }
                }
        }
    }
    
    /**
     * Get user data by ID with caching and realtime updates
     */
    fun getUserById(userId: String): LiveData<User?> {
        val userLiveData = MutableLiveData<User?>()
        
        // Check cache first
        userCache[userId]?.let {
            userLiveData.value = it
        }
        
        // Start listening if not already listening
        if (!userListeners.containsKey(userId)) {
            val listener = firestore.collection("users")
                .document(userId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        return@addSnapshotListener
                    }
                    
                    if (snapshot?.exists() == true) {
                        val user = snapshot.toObject(User::class.java)?.copy(id = snapshot.id)
                        if (user != null) {
                            userCache[userId] = user
                            userLiveData.value = user
                        }
                    }
                }
            
            userListeners[userId] = listener
        } else {
            // If already listening, return cached data
            userLiveData.value = userCache[userId]
        }
        
        return userLiveData
    }
    
    /**
     * Update current user profile
     */
    fun updateUserProfile(fullName: String, username: String, profileImageBase64: String?) {
        val currentUserId = auth.currentUser?.uid
        if (currentUserId == null) {
            _errorMessage.value = "User not authenticated"
            return
        }
        
        _isLoading.value = true
        
        val updates = mutableMapOf<String, Any>(
            "fullName" to fullName.trim(),
            "username" to username.trim(),
            "updatedAt" to System.currentTimeMillis()
        )
        
        // Add profile image if provided
        profileImageBase64?.let {
            updates["profileImageUrl"] = it
        }
        
        firestore.collection("users")
            .document(currentUserId)
            .update(updates)
            .addOnSuccessListener {
                _isLoading.value = false
                _updateSuccess.value = true
                _errorMessage.value = null
            }
            .addOnFailureListener { exception ->
                _isLoading.value = false
                _updateSuccess.value = false
                _errorMessage.value = "Gagal memperbarui profil: ${exception.message}"
            }
    }
    
    /**
     * Clear error message
     */
    fun clearErrorMessage() {
        _errorMessage.value = null
    }
    
    /**
     * Clear update success flag
     */
    fun clearUpdateSuccess() {
        _updateSuccess.value = false
    }
    
    /**
     * Get cached user data
     */
    fun getCachedUser(userId: String): User? {
        return userCache[userId]
    }
    
    /**
     * Get current user ID
     */
    fun getCurrentUserId(): String? {
        return auth.currentUser?.uid
    }
    
    /**
     * Preload users for performance
     */
    fun preloadUsers(userIds: List<String>) {
        userIds.forEach { userId ->
            if (!userCache.containsKey(userId) && !userListeners.containsKey(userId)) {
                getUserById(userId)
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        
        // Remove all listeners
        currentUserListener?.remove()
        userListeners.values.forEach { it.remove() }
        userListeners.clear()
        userCache.clear()
    }
}
