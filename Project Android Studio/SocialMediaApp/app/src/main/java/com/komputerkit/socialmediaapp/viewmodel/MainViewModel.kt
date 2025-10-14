package com.komputerkit.socialmediaapp.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.model.UserStories
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.utils.StoryUserDataJoiner

/**
 * MainViewModel untuk mengelola data di MainActivity
 * - Mengelola stories dengan realtime user data join
 * - Mengelola posts dengan realtime user data join  
 * - Auto refresh ketika user profile berubah
 */
class MainViewModel : ViewModel() {
    
    private val repository = FirebaseRepository()
    private val userViewModel = UserViewModel()
    private val storyUserDataJoiner = StoryUserDataJoiner()
    
    // Raw stories data dari Firestore
    private val _rawStories = MutableLiveData<List<Story>>()
    
    // Combined UserStories dengan real user data
    private val _userStories = MutableLiveData<List<UserStories>>()
    val userStories: LiveData<List<UserStories>> = _userStories
    
    // Posts data
    private val _posts = MutableLiveData<List<Post>>()
    val posts: LiveData<List<Post>> = _posts
    
    // Loading states
    private val _isLoadingStories = MutableLiveData<Boolean>()
    val isLoadingStories: LiveData<Boolean> = _isLoadingStories
    
    private val _isLoadingPosts = MutableLiveData<Boolean>()
    val isLoadingPosts: LiveData<Boolean> = _isLoadingPosts
    
    // Firestore listeners
    private var storiesListener: ListenerRegistration? = null
    private var postsListener: ListenerRegistration? = null
    
    // Combined LiveData untuk auto refresh
    private var combinedStoriesLiveData: LiveData<List<UserStories>>? = null
    
    init {
        startListening()
    }
    
    private fun startListening() {
        startListeningToStories()
        startListeningToPosts()
    }
    
    private fun startListeningToStories() {
        _isLoadingStories.value = true
        
        storiesListener = repository.getStoriesRealTime { stories ->
            _rawStories.value = stories
            
            // Setup combined data dengan user join jika belum ada
            if (combinedStoriesLiveData == null) {
                val currentUserId = userViewModel.getCurrentUserId()
                
                combinedStoriesLiveData = storyUserDataJoiner.combineStoriesWithUsers(
                    _rawStories,
                    { userId ->
                        userViewModel.getUserById(userId)
                    },
                    currentUserId
                )
                
                // Observe combined data
                combinedStoriesLiveData?.observeForever { userStoriesList ->
                    _userStories.value = userStoriesList
                    _isLoadingStories.value = false
                }
            }
        }
    }
    
    private fun startListeningToPosts() {
        _isLoadingPosts.value = true
        
        postsListener = repository.getPostsRealTime { posts ->
            _posts.value = posts
            _isLoadingPosts.value = false
            
            // Preload user data untuk semua posts
            val userIds = posts.map { it.userId }.distinct()
            userViewModel.preloadUsers(userIds)
        }
    }
    
    /**
     * Get user data untuk post tertentu
     */
    fun getUserForPost(userId: String): LiveData<com.komputerkit.socialmediaapp.model.User?> {
        return userViewModel.getUserById(userId)
    }
    
    /**
     * Refresh stories manually
     */
    fun refreshStories() {
        // Data akan di-refresh otomatis melalui listener
    }
    
    /**
     * Refresh posts manually
     */
    fun refreshPosts() {
        // Data akan di-refresh otomatis melalui listener
    }
    
    override fun onCleared() {
        super.onCleared()
        storiesListener?.remove()
        postsListener?.remove()
        combinedStoriesLiveData?.removeObserver { }
    }
}
