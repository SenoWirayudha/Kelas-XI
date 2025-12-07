package com.komputerkit.socialmediaapp.utils

import androidx.lifecycle.LiveData
import androidx.lifecycle.MediatorLiveData
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.model.UserStories

/**
 * StoryUserDataJoiner - Helper class untuk menggabungkan data story dengan user data
 * Menggunakan LiveData untuk auto refresh realtime ketika user data berubah
 */
class StoryUserDataJoiner {
    
    /**
     * Combine stories dengan user data dari multiple users
     * @param storiesLiveData LiveData dari stories
     * @param getUserData Function untuk mendapatkan LiveData user berdasarkan userId
     * @param currentUserId Current user ID yang harus selalu ditampilkan
     * @return LiveData<List<UserStories>> yang ter-update otomatis
     */
    fun combineStoriesWithUsers(
        storiesLiveData: LiveData<List<Story>>,
        getUserData: (String) -> LiveData<User?>,
        currentUserId: String? = null
    ): LiveData<List<UserStories>> {
        
        val result = MediatorLiveData<List<UserStories>>()
        val userDataMap = mutableMapOf<String, User?>()
        val userLiveDataMap = mutableMapOf<String, LiveData<User?>>()
        
        // Function untuk rebuild UserStories list
        fun rebuildUserStories() {
            val stories = storiesLiveData.value ?: emptyList()
            
            // Group stories by userId
            val storiesByUser = stories.groupBy { it.userId }
            
            // Get all unique user IDs including current user
            val allUserIds = mutableSetOf<String>().apply {
                addAll(storiesByUser.keys)
                currentUserId?.let { add(it) }
            }
            
            // Build UserStories list
            val userStoriesList = allUserIds.map { userId ->
                val userStories = storiesByUser[userId] ?: emptyList()
                val user = userDataMap[userId]
                
                UserStories(
                    userId = userId,
                    userName = user?.username ?: "Unknown User",
                    userProfileImage = user?.profileImageUrl ?: "",
                    stories = userStories.sortedByDescending { it.timestamp },
                    hasUnviewedStories = userStories.any { !it.viewed }
                )
            }.sortedWith { a, b ->
                // Always put current user first
                when {
                    a.userId == currentUserId && b.userId != currentUserId -> -1
                    a.userId != currentUserId && b.userId == currentUserId -> 1
                    else -> {
                        // For others, sort by latest story timestamp
                        val aLatest = a.stories.maxOfOrNull { it.timestamp } ?: 0
                        val bLatest = b.stories.maxOfOrNull { it.timestamp } ?: 0
                        bLatest.compareTo(aLatest)
                    }
                }
            }
            
            result.value = userStoriesList
        }
        
        // Listen to stories changes
        result.addSource(storiesLiveData) { stories ->
            // Get unique user IDs including current user
            val userIds = mutableSetOf<String>().apply {
                addAll(stories.map { it.userId })
                currentUserId?.let { add(it) }
            }.toList()
            
            // Remove old user listeners that are no longer needed
            val currentUserIds = userLiveDataMap.keys.toSet()
            val obsoleteUserIds = currentUserIds - userIds.toSet()
            obsoleteUserIds.forEach { userId ->
                userLiveDataMap[userId]?.let { liveData ->
                    result.removeSource(liveData)
                }
                userLiveDataMap.remove(userId)
                userDataMap.remove(userId)
            }
            
            // Add new user listeners
            userIds.forEach { userId ->
                if (!userLiveDataMap.containsKey(userId)) {
                    val userLiveData = getUserData(userId)
                    userLiveDataMap[userId] = userLiveData
                    
                    result.addSource(userLiveData) { user ->
                        userDataMap[userId] = user
                        rebuildUserStories()
                    }
                }
            }
            
            rebuildUserStories()
        }
        
        return result
    }
    
    /**
     * Get user data untuk satu post dengan auto refresh
     */
    fun getPostWithUserData(
        postUserId: String,
        getUserData: (String) -> LiveData<User?>
    ): LiveData<User?> {
        return getUserData(postUserId)
    }
}
