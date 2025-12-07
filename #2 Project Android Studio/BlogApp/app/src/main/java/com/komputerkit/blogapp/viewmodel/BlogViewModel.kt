package com.komputerkit.blogapp.viewmodel

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.blogapp.data.BlogPost
import com.komputerkit.blogapp.repository.BlogRepository
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class BlogViewModel : ViewModel() {
    private val repository = BlogRepository()

    private val _posts = MutableLiveData<List<BlogPost>>()
    val posts: LiveData<List<BlogPost>> = _posts

    private val _userPosts = MutableLiveData<List<BlogPost>>()
    val userPosts: LiveData<List<BlogPost>> = _userPosts

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _isPostCreated = MutableLiveData<Boolean>()
    val isPostCreated: LiveData<Boolean> = _isPostCreated

    private val _postCreated = MutableLiveData<Boolean>()
    val postCreated: LiveData<Boolean> = _postCreated

    private val _postUpdated = MutableLiveData<Boolean>()
    val postUpdated: LiveData<Boolean> = _postUpdated

    private val _postDeleted = MutableLiveData<Boolean>()
    val postDeleted: LiveData<Boolean> = _postDeleted

    private val _likeToggled = MutableLiveData<Boolean>()
    val likeToggled: LiveData<Boolean> = _likeToggled

    private val _saveToggled = MutableLiveData<Boolean>()
    val saveToggled: LiveData<Boolean> = _saveToggled

    private val _savedPosts = MutableLiveData<List<BlogPost>>()
    val savedPosts: LiveData<List<BlogPost>> = _savedPosts

    private val _currentPost = MutableLiveData<BlogPost?>()
    val currentPost: LiveData<BlogPost?> = _currentPost

    init {
        loadPosts()
    }

    fun loadPosts() {
        repository.getAllPosts()
            .onEach { posts ->
                _posts.value = posts
            }
            .catch { exception ->
                Log.e("BlogViewModel", "Error loading posts", exception)
                _error.value = "Error loading posts: ${exception.message}"
                _posts.value = emptyList()
            }
            .launchIn(viewModelScope)
    }

    fun loadUserPosts(userId: String) {
        repository.getUserPosts(userId)
            .onEach { posts ->
                _userPosts.value = posts
            }
            .catch { exception ->
                Log.e("BlogViewModel", "Error loading user posts", exception)
                _error.value = "Error loading user posts: ${exception.message}"
                _userPosts.value = emptyList()
            }
            .launchIn(viewModelScope)
    }

    fun loadUserPostsByName(authorName: String) {
        repository.getUserPostsByAuthorName(authorName)
            .onEach { posts ->
                Log.d("BlogViewModel", "Loaded ${posts.size} posts by author name: $authorName")
                _userPosts.value = posts
            }
            .catch { exception ->
                Log.e("BlogViewModel", "Error loading posts by author name", exception)
                _error.value = "Error loading posts by author name: ${exception.message}"
                _userPosts.value = emptyList()
            }
            .launchIn(viewModelScope)
    }

    fun fixOrphanedPosts(currentUserId: String, currentUserName: String) {
        viewModelScope.launch {
            try {
                Log.d("BlogViewModel", "Starting to fix orphaned posts")
                val result = repository.fixOrphanedPosts(currentUserId, currentUserName)
                if (result.isSuccess) {
                    val fixedCount = result.getOrNull() ?: 0
                    Log.d("BlogViewModel", "Successfully fixed $fixedCount orphaned posts")
                    // Reload user posts after fixing
                    loadUserPosts(currentUserId)
                } else {
                    Log.e("BlogViewModel", "Failed to fix orphaned posts: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
                Log.e("BlogViewModel", "Error in fixOrphanedPosts", e)
            }
        }
    }

    fun createPost(title: String, content: String, imageBase64: String? = null) {
        if (title.isBlank() || content.isBlank()) {
            _error.value = "Title and content cannot be empty"
            return
        }
        
        _loading.value = true
        viewModelScope.launch {
            try {
                repository.createPost(title, content, imageBase64)
                _isPostCreated.value = true
                _postCreated.value = true
                _loading.value = false
                loadPosts() // Refresh general posts after creating
                // Also refresh user posts for current user
                com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid?.let { userId ->
                    loadUserPosts(userId)
                }
            } catch (e: Exception) {
                _error.value = "Failed to create post: ${e.message}"
                _loading.value = false
            }
        }
    }

    fun updatePost(postId: String, title: String, content: String, imageBase64: String? = null) {
        if (title.isBlank() || content.isBlank()) {
            _error.value = "Title and content cannot be empty"
            return
        }
        
        _loading.value = true
        viewModelScope.launch {
            try {
                repository.updatePost(postId, title, content, imageBase64)
                _postUpdated.value = true
                _loading.value = false
                loadPosts() // Refresh general posts after updating
                // Also refresh user posts for current user
                com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid?.let { userId ->
                    loadUserPosts(userId)
                }
            } catch (e: Exception) {
                _error.value = "Failed to update post: ${e.message}"
                _loading.value = false
            }
        }
    }

    fun deletePost(postId: String) {
        _loading.value = true
        viewModelScope.launch {
            try {
                repository.deletePost(postId)
                _postDeleted.value = true
                _loading.value = false
                loadPosts() // Refresh general posts after deleting
                // Also refresh user posts for current user
                com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid?.let { userId ->
                    loadUserPosts(userId)
                }
            } catch (e: Exception) {
                _error.value = "Failed to delete post: ${e.message}"
                _loading.value = false
            }
        }
    }

    fun getPost(postId: String): LiveData<BlogPost?> {
        val result = MutableLiveData<BlogPost?>()
        viewModelScope.launch {
            try {
                val postResult = repository.getPostById(postId)
                result.value = postResult.getOrNull()
            } catch (e: Exception) {
                _error.value = "Failed to get post: ${e.message}"
                result.value = null
            }
        }
        return result
    }

    fun getPostById(postId: String) {
        viewModelScope.launch {
            try {
                val postResult = repository.getPostById(postId)
                _currentPost.value = postResult.getOrNull()
            } catch (e: Exception) {
                _error.value = "Failed to get post: ${e.message}"
                _currentPost.value = null
            }
        }
    }

    fun toggleLike(postId: String) {
        viewModelScope.launch {
            try {
                val isLiked = repository.toggleLike(postId)
                _likeToggled.value = true
                loadPosts() // Refresh posts to update like counts
            } catch (e: Exception) {
                _error.value = "Failed to toggle like: ${e.message}"
            }
        }
    }

    fun toggleSave(postId: String) {
        viewModelScope.launch {
            try {
                val isSaved = repository.toggleSave(postId)
                _saveToggled.value = true
                loadPosts() // Refresh posts to update save status
            } catch (e: Exception) {
                _error.value = "Failed to toggle save: ${e.message}"
            }
        }
    }

    fun loadSavedPosts(userId: String) {
        repository.getSavedPosts(userId)
            .onEach { posts ->
                _savedPosts.value = posts
            }
            .catch { exception ->
                Log.e("BlogViewModel", "Error loading saved posts", exception)
                _error.value = "Error loading saved posts: ${exception.message}"
                _savedPosts.value = emptyList()
            }
            .launchIn(viewModelScope)
    }

    fun clearError() {
        _error.value = null
    }

    fun clearPostCreated() {
        _isPostCreated.value = false
        _postCreated.value = false
    }

    fun clearPostUpdated() {
        _postUpdated.value = false
    }

    fun clearPostDeleted() {
        _postDeleted.value = false
    }

    fun clearLikeToggled() {
        _likeToggled.value = false
    }

    fun clearSaveToggled() {
        _saveToggled.value = false
    }

    fun refreshCurrentUserPosts() {
        com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid?.let { userId ->
            Log.d("BlogViewModel", "Refreshing posts for current user: $userId")
            loadUserPosts(userId)
        } ?: Log.w("BlogViewModel", "No current user to refresh posts for")
    }

    fun updateUserPostsProfile(userId: String, newDisplayName: String, newProfileImage: String) {
        viewModelScope.launch {
            Log.d("BlogViewModel", "Updating user posts profile for user: $userId")
            repository.updateUserPostsProfile(userId, newDisplayName, newProfileImage)
                .onSuccess {
                    Log.d("BlogViewModel", "✅ User posts profile updated successfully")
                    // Refresh posts to show updated data
                    loadPosts()
                    loadUserPosts(userId)
                }
                .onFailure { exception ->
                    Log.e("BlogViewModel", "❌ Failed to update user posts profile", exception)
                    _error.value = "Failed to update posts: ${exception.message}"
                }
        }
    }
}