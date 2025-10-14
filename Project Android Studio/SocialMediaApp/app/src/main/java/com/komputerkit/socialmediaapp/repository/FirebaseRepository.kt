package com.komputerkit.socialmediaapp.repository

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.model.Comment
import com.komputerkit.socialmediaapp.model.Notification
import com.komputerkit.socialmediaapp.model.NotificationTypes

class FirebaseRepository {
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    companion object {
        const val STORIES_COLLECTION = "stories"
        const val POSTS_COLLECTION = "posts"
        const val USERS_COLLECTION = "users"
        const val COMMENTS_COLLECTION = "comments"
        const val NOTIFICATIONS_COLLECTION = "notifications"
    }

    // Stories methods
    fun getStoriesRealTime(callback: (List<Story>) -> Unit): ListenerRegistration {
        return firestore.collection(STORIES_COLLECTION)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    callback(emptyList())
                    return@addSnapshotListener
                }

                val stories = snapshot?.documents?.mapNotNull { document ->
                    try {
                        document.toObject(Story::class.java)?.copy(id = document.id)
                    } catch (e: Exception) {
                        null
                    }
                } ?: emptyList()

                callback(stories)
            }
    }

    fun markStoryAsViewed(storyId: String, userId: String) {
        firestore.collection(STORIES_COLLECTION)
            .document(storyId)
            .update("viewedBy", com.google.firebase.firestore.FieldValue.arrayUnion(userId))
    }

    // Posts methods
    fun getPostsRealTime(callback: (List<Post>) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "Setting up posts real-time listener")
        return firestore.collection(POSTS_COLLECTION)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error listening to posts", exception)
                    callback(emptyList())
                    return@addSnapshotListener
                }

                Log.d("FirebaseRepository", "Snapshot received, documents: ${snapshot?.documents?.size}")
                val posts = snapshot?.documents?.mapNotNull { document ->
                    try {
                        val post = document.toObject(Post::class.java)?.copy(id = document.id)
                        Log.d("FirebaseRepository", "Parsed post: ${post?.id} - ${post?.description}")
                        post
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error parsing post: ${document.id}", e)
                        null
                    }
                } ?: emptyList()

                Log.d("FirebaseRepository", "Calling callback with ${posts.size} posts")
                callback(posts)
            }
    }

    fun toggleLike(postId: String, userId: String, callback: (Boolean, Boolean) -> Unit) {
        Log.d("FirebaseRepository", "toggleLike called for postId: $postId, userId: $userId")
        val postRef = firestore.collection(POSTS_COLLECTION).document(postId)
        
        firestore.runTransaction { transaction ->
            val snapshot = transaction.get(postRef)
            val post = snapshot.toObject(Post::class.java)
            
            if (post != null) {
                Log.d("FirebaseRepository", "Post found, current likes: ${post.likes}, likedBy: ${post.likedBy}")
                val likedBy = post.likedBy.toMutableList()
                val isCurrentlyLiked = likedBy.contains(userId)
                Log.d("FirebaseRepository", "User currently liked: $isCurrentlyLiked")
                
                if (isCurrentlyLiked) {
                    // Unlike
                    likedBy.remove(userId)
                    val newLikesCount = maxOf(0, post.likes - 1) // Prevent negative likes
                    transaction.update(postRef, mapOf(
                        "likedBy" to likedBy,
                        "likes" to newLikesCount
                    ))
                    Log.d("FirebaseRepository", "Unliked post, new count: $newLikesCount")
                } else {
                    // Like
                    likedBy.add(userId)
                    val newLikesCount = post.likes + 1
                    transaction.update(postRef, mapOf(
                        "likedBy" to likedBy,
                        "likes" to newLikesCount
                    ))
                    Log.d("FirebaseRepository", "Liked post, new count: $newLikesCount")
                }
                
                !isCurrentlyLiked // Return new like state
            } else {
                Log.e("FirebaseRepository", "Post not found!")
                throw Exception("Post not found")
            }
        }.addOnSuccessListener { isNowLiked ->
            Log.d("FirebaseRepository", "Transaction successful, new like state: $isNowLiked")
            
            // Create notification if post was liked (not unliked)
            if (isNowLiked) {
                // Get post data and liker user data to create notification
                postRef.get().addOnSuccessListener { postSnapshot ->
                    val post = postSnapshot.toObject(Post::class.java)
                    if (post != null) {
                        // Get liker user data
                        getUserById(userId) { likerUser ->
                            if (likerUser != null) {
                                createLikeNotification(
                                    postOwnerId = post.userId,
                                    likerUserId = userId,
                                    likerUserName = likerUser.username,
                                    likerProfileImage = likerUser.profileImageUrl,
                                    postId = postId,
                                    postImageUrl = post.imageUrl.ifEmpty { post.postImageUrl }
                                )
                            }
                        }
                    }
                }
            }
            
            callback(true, isNowLiked)
        }.addOnFailureListener { exception ->
            Log.e("FirebaseRepository", "Transaction failed: ${exception.message}")
            callback(false, false)
        }
    }

    fun addPost(post: Post, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Adding post with hashtags: ${post.hashtags}")
        firestore.collection(POSTS_COLLECTION)
            .add(post)
            .addOnSuccessListener { documentReference ->
                Log.d("FirebaseRepository", "Post added successfully with ID: ${documentReference.id}")
                Log.d("FirebaseRepository", "Post hashtags saved: ${post.hashtags}")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Failed to add post", exception)
                callback(false)
            }
    }

    fun deletePost(postId: String, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Deleting post with ID: $postId")
        firestore.collection(POSTS_COLLECTION)
            .document(postId)
            .delete()
            .addOnSuccessListener {
                Log.d("FirebaseRepository", "Post deleted successfully: $postId")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Failed to delete post: $postId", exception)
                callback(false)
            }
    }

    fun addStory(story: Story, callback: (Boolean) -> Unit) {
        firestore.collection(STORIES_COLLECTION)
            .add(story)
            .addOnSuccessListener {
                callback(true)
            }
            .addOnFailureListener {
                callback(false)
            }
    }

    // Search methods
    fun searchUsers(query: String, callback: (List<User>) -> Unit): ListenerRegistration {
        val searchQuery = query.lowercase()
        Log.d("FirebaseRepository", "searchUsers called with query: '$query' -> '$searchQuery'")
        return firestore.collection(USERS_COLLECTION)
            .whereGreaterThanOrEqualTo("username", searchQuery)
            .whereLessThanOrEqualTo("username", searchQuery + "\uf8ff")
            .limit(20)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error searching users", exception)
                    callback(emptyList())
                    return@addSnapshotListener
                }

                Log.d("FirebaseRepository", "searchUsers snapshot received, document count: ${snapshot?.documents?.size ?: 0}")
                val users = snapshot?.documents?.mapNotNull { document ->
                    try {
                        Log.d("FirebaseRepository", "Processing user document: ${document.id}, data: ${document.data}")
                        val user = document.toObject(User::class.java)?.copy(id = document.id)
                        // Also search in displayName if not found in username
                        if (user != null && (user.username.lowercase().contains(searchQuery) || 
                                           user.displayName.lowercase().contains(searchQuery))) {
                            Log.d("FirebaseRepository", "User matched: ${user.username} with ID: ${user.id}")
                            user
                        } else {
                            Log.d("FirebaseRepository", "User not matched: ${user?.username}")
                            null
                        }
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error converting user document ${document.id}", e)
                        null
                    }
                } ?: emptyList()

                Log.d("FirebaseRepository", "Final users list size: ${users.size}")
                callback(users)
            }
    }

    fun searchPostsByHashtag(hashtag: String, callback: (List<Post>) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "searchPostsByHashtag called with hashtag: '$hashtag'")
        return firestore.collection(POSTS_COLLECTION)
            .whereArrayContains("hashtags", hashtag.lowercase())
            .limit(50) // Increase limit dan sort di client side
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error searching posts by hashtag", exception)
                    callback(emptyList())
                    return@addSnapshotListener
                }

                val posts = snapshot?.documents?.mapNotNull { document ->
                    try {
                        val post = document.toObject(Post::class.java)?.copy(id = document.id)
                        Log.d("FirebaseRepository", "Found post: ${post?.id} with hashtags: ${post?.hashtags}")
                        post
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error parsing post document", e)
                        null
                    }
                } ?: emptyList()

                // Sort by timestamp di client side untuk menghindari composite index
                val sortedPosts = posts.sortedByDescending { it.timestamp }
                
                Log.d("FirebaseRepository", "Returning ${sortedPosts.size} posts for hashtag '$hashtag'")
                callback(sortedPosts)
            }
    }

    // Alternative method untuk debug - search semua posts lalu filter
    fun searchPostsByHashtagDebug(hashtag: String, callback: (List<Post>) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "searchPostsByHashtagDebug called with hashtag: '$hashtag'")
        return firestore.collection(POSTS_COLLECTION)
            .limit(100)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error in debug search", exception)
                    callback(emptyList())
                    return@addSnapshotListener
                }

                val allPosts = snapshot?.documents?.mapNotNull { document ->
                    try {
                        document.toObject(Post::class.java)?.copy(id = document.id)
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error parsing post document", e)
                        null
                    }
                } ?: emptyList()

                Log.d("FirebaseRepository", "Debug: Found ${allPosts.size} total posts")
                
                // Filter posts that contain the hashtag
                val filteredPosts = allPosts.filter { post ->
                    val hasHashtag = post.hashtags.contains(hashtag.lowercase())
                    Log.d("FirebaseRepository", "Post ${post.id} hashtags: ${post.hashtags}, contains '$hashtag': $hasHashtag")
                    hasHashtag
                }.sortedByDescending { it.timestamp }

                Log.d("FirebaseRepository", "Debug: Returning ${filteredPosts.size} filtered posts for hashtag '$hashtag'")
                callback(filteredPosts)
            }
    }

    fun getTrendingPosts(callback: (List<Post>) -> Unit): ListenerRegistration {
        return firestore.collection(POSTS_COLLECTION)
            .orderBy("likes", Query.Direction.DESCENDING)
            .limit(10)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    callback(emptyList())
                    return@addSnapshotListener
                }

                val posts = snapshot?.documents?.mapNotNull { document ->
                    try {
                        document.toObject(Post::class.java)?.copy(id = document.id)
                    } catch (e: Exception) {
                        null
                    }
                } ?: emptyList()

                callback(posts)
            }
    }

    // User methods
    fun getUser(userId: String, callback: (User?) -> Unit) {
        Log.d("FirebaseRepository", "getUser - querying userId: $userId")
        firestore.collection(USERS_COLLECTION)
            .document(userId)
            .get()
            .addOnSuccessListener { document ->
                Log.d("FirebaseRepository", "getUser - document exists: ${document.exists()}")
                Log.d("FirebaseRepository", "getUser - document data: ${document.data}")
                val user = try {
                    document.toObject(User::class.java)?.copy(id = document.id)
                } catch (e: Exception) {
                    Log.e("FirebaseRepository", "getUser - error parsing user: $e")
                    null
                }
                Log.d("FirebaseRepository", "getUser - parsed user: $user")
                callback(user)
            }
            .addOnFailureListener { e ->
                Log.e("FirebaseRepository", "getUser - failure: $e")
                callback(null)
            }
    }

    fun updateUser(user: User, callback: (Boolean) -> Unit) {
        firestore.collection(USERS_COLLECTION)
            .document(user.id)
            .set(user)
            .addOnSuccessListener {
                callback(true)
            }
            .addOnFailureListener {
                callback(false)
            }
    }

    fun followUser(currentUserId: String, targetUserId: String, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Starting follow user: $currentUserId -> $targetUserId")
        // First get current data to calculate proper counts
        val currentUserRef = firestore.collection(USERS_COLLECTION).document(currentUserId)
        val targetUserRef = firestore.collection(USERS_COLLECTION).document(targetUserId)
        
        firestore.runTransaction { transaction ->
            val currentUserSnapshot = transaction.get(currentUserRef)
            val targetUserSnapshot = transaction.get(targetUserRef)
            
            val currentUser = currentUserSnapshot.toObject(User::class.java)
            val targetUser = targetUserSnapshot.toObject(User::class.java)
            
            Log.d("FirebaseRepository", "Current user followers: ${currentUser?.followers?.size}, following: ${currentUser?.following?.size}")
            Log.d("FirebaseRepository", "Target user followers: ${targetUser?.followers?.size}, following: ${targetUser?.following?.size}")
            
            if (currentUser != null && targetUser != null) {
                // Check if already following
                if (!currentUser.following.contains(targetUserId)) {
                    // Update arrays
                    val newCurrentFollowing = currentUser.following + targetUserId
                    val newTargetFollowers = targetUser.followers + currentUserId
                    
                    Log.d("FirebaseRepository", "New target followers count: ${newTargetFollowers.size}")
                    
                    // Update with correct counts based on array sizes
                    transaction.update(currentUserRef, mapOf(
                        "following" to newCurrentFollowing,
                        "followingCount" to newCurrentFollowing.size.toLong()
                    ))
                    
                    transaction.update(targetUserRef, mapOf(
                        "followers" to newTargetFollowers,
                        "followersCount" to newTargetFollowers.size.toLong()
                    ))
                } else {
                    Log.d("FirebaseRepository", "User already following - skipping")
                }
            }
        }.addOnSuccessListener {
            Log.d("FirebaseRepository", "Follow user successful")
            
            // Create follow notification
            getUserById(currentUserId) { followerUser ->
                if (followerUser != null) {
                    createFollowNotification(
                        followedUserId = targetUserId,
                        followerUserId = currentUserId,
                        followerUserName = followerUser.username,
                        followerProfileImage = followerUser.profileImageUrl
                    )
                }
            }
            
            callback(true)
        }.addOnFailureListener { e ->
            Log.e("FirebaseRepository", "Follow user failed", e)
            callback(false)
        }
    }

    fun unfollowUser(currentUserId: String, targetUserId: String, callback: (Boolean) -> Unit) {
        // First get current data to calculate proper counts
        val currentUserRef = firestore.collection(USERS_COLLECTION).document(currentUserId)
        val targetUserRef = firestore.collection(USERS_COLLECTION).document(targetUserId)
        
        firestore.runTransaction { transaction ->
            val currentUserSnapshot = transaction.get(currentUserRef)
            val targetUserSnapshot = transaction.get(targetUserRef)
            
            val currentUser = currentUserSnapshot.toObject(User::class.java)
            val targetUser = targetUserSnapshot.toObject(User::class.java)
            
            if (currentUser != null && targetUser != null) {
                // Check if currently following
                if (currentUser.following.contains(targetUserId)) {
                    // Update arrays
                    val newCurrentFollowing = currentUser.following - targetUserId
                    val newTargetFollowers = targetUser.followers - currentUserId
                    
                    // Update with correct counts based on array sizes
                    transaction.update(currentUserRef, mapOf(
                        "following" to newCurrentFollowing,
                        "followingCount" to newCurrentFollowing.size.toLong()
                    ))
                    
                    transaction.update(targetUserRef, mapOf(
                        "followers" to newTargetFollowers,
                        "followersCount" to newTargetFollowers.size.toLong()
                    ))
                }
            }
        }.addOnSuccessListener {
            callback(true)
        }.addOnFailureListener { e ->
            Log.e("FirebaseRepository", "Unfollow user failed", e)
            callback(false)
        }
    }

    fun getUserPosts(userId: String, callback: (List<Post>) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "getUserPosts called for userId: $userId")
        return firestore.collection(POSTS_COLLECTION)
            .whereEqualTo("userId", userId)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error getting posts for user $userId", exception)
                    callback(emptyList())
                    return@addSnapshotListener
                }

                Log.d("FirebaseRepository", "getUserPosts snapshot received for userId: $userId")
                Log.d("FirebaseRepository", "Document count: ${snapshot?.documents?.size ?: 0}")
                
                val posts = snapshot?.documents?.mapNotNull { document ->
                    try {
                        Log.d("FirebaseRepository", "Processing document: ${document.id}, data: ${document.data}")
                        val post = document.toObject(Post::class.java)?.copy(id = document.id)
                        Log.d("FirebaseRepository", "Converted post: $post")
                        post
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error converting document ${document.id} to Post", e)
                        null
                    }
                } ?: emptyList()

                Log.d("FirebaseRepository", "Final posts list size: ${posts.size}")
                callback(posts)
            }
    }

    fun getPost(postId: String, callback: (Post?) -> Unit) {
        firestore.collection(POSTS_COLLECTION)
            .document(postId)
            .get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    try {
                        val post = document.toObject(Post::class.java)?.copy(id = document.id)
                        callback(post)
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error parsing post", e)
                        callback(null)
                    }
                } else {
                    callback(null)
                }
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Error getting post", exception)
                callback(null)
            }
    }

    // Debug method to check all posts
    fun getAllPosts(callback: (List<Post>) -> Unit) {
        Log.d("FirebaseRepository", "getAllPosts called for debugging")
        firestore.collection(POSTS_COLLECTION)
            .get()
            .addOnSuccessListener { querySnapshot ->
                Log.d("FirebaseRepository", "getAllPosts success, document count: ${querySnapshot.documents.size}")
                val posts = querySnapshot.documents.mapNotNull { document ->
                    try {
                        Log.d("FirebaseRepository", "Processing post document: ${document.id}, data: ${document.data}")
                        val post = document.toObject(Post::class.java)?.copy(id = document.id)
                        Log.d("FirebaseRepository", "Converted post: $post")
                        post
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error converting post document ${document.id}", e)
                        null
                    }
                }
                Log.d("FirebaseRepository", "Final posts list size: ${posts.size}")
                callback(posts)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Error getting all posts", exception)
                callback(emptyList())
            }
    }

    // Sample data methods for testing
    fun addSampleData() {
        addSampleUsers()
        addSampleStories()
        addSamplePosts()
    }

    private fun addSampleUsers() {
        val users = listOf(
            User(
                username = "johndoe",
                displayName = "John Doe",
                email = "john@example.com",
                profileImageUrl = "https://picsum.photos/200/200?random=1",
                bio = "Photographer & Travel Enthusiast 📸",
                followers = listOf("user2", "user3"),
                following = listOf("user2"),
                postsCount = 12,
                isVerified = true,
                createdAt = System.currentTimeMillis()
            ),
            User(
                username = "janesmith",
                displayName = "Jane Smith",
                email = "jane@example.com",
                profileImageUrl = "https://picsum.photos/200/200?random=2",
                bio = "Coffee lover ☕ | Developer 💻",
                followers = listOf("user1", "user3"),
                following = listOf("user1", "user3"),
                postsCount = 8,
                isVerified = false,
                createdAt = System.currentTimeMillis()
            ),
            User(
                username = "bobjohnson",
                displayName = "Bob Johnson",
                email = "bob@example.com",
                profileImageUrl = "https://picsum.photos/200/200?random=3",
                bio = "Adventure seeker 🏔️ | Nature lover 🌲",
                followers = listOf("user1", "user2"),
                following = listOf("user1"),
                postsCount = 15,
                isVerified = true,
                createdAt = System.currentTimeMillis()
            )
        )

        users.forEach { user ->
            firestore.collection(USERS_COLLECTION).add(user)
        }
    }

    private fun addSampleStories() {
        val stories = listOf(
            Story(
                userId = "user1",
                userName = "John Doe",
                userProfileImage = "https://picsum.photos/200/200?random=1",
                storyImageUrl = "https://picsum.photos/400/600?random=1",
                timestamp = System.currentTimeMillis()
            ),
            Story(
                userId = "user2",
                userName = "Jane Smith",
                userProfileImage = "https://picsum.photos/200/200?random=2",
                storyImageUrl = "https://picsum.photos/400/600?random=2",
                timestamp = System.currentTimeMillis() - 3600000
            ),
            Story(
                userId = "user3",
                userName = "Bob Johnson",
                userProfileImage = "https://picsum.photos/200/200?random=3",
                storyImageUrl = "https://picsum.photos/400/600?random=3",
                timestamp = System.currentTimeMillis() - 7200000
            )
        )

        stories.forEach { story ->
            addStory(story) { success ->
                if (success) {
                    println("Sample story added successfully")
                }
            }
        }
    }

    private fun addSamplePosts() {
        val posts = listOf(
            // Posts for mike_chen
            Post(
                userId = "mike_chen",
                userName = "Mike Chen",
                userProfileImage = "https://picsum.photos/200/200?random=10",
                postImageUrl = "https://picsum.photos/600/600?random=51",
                description = "Adventure seeker 🏔️ | Travel blogger | Living life one hike at a time",
                likes = 35,
                timestamp = System.currentTimeMillis(),
                likedBy = listOf("sarah_williams", "alex_jones"),
                hashtags = listOf("adventure", "travel", "hiking")
            ),
            Post(
                userId = "mike_chen",
                userName = "Mike Chen", 
                userProfileImage = "https://picsum.photos/200/200?random=10",
                postImageUrl = "https://picsum.photos/600/600?random=52",
                description = "Beautiful mountain views from today's hike! #nature #mountains",
                likes = 28,
                timestamp = System.currentTimeMillis() - 86400000,
                likedBy = listOf("sarah_williams", "jessica_brown"),
                hashtags = listOf("nature", "mountains", "hiking")
            ),
            Post(
                userId = "mike_chen",
                userName = "Mike Chen",
                userProfileImage = "https://picsum.photos/200/200?random=10", 
                postImageUrl = "https://picsum.photos/600/600?random=53",
                description = "Camping under the stars ⭐ #camping #stargazing",
                likes = 42,
                timestamp = System.currentTimeMillis() - 172800000,
                likedBy = listOf("alex_jones", "jessica_brown", "david_wilson"),
                hashtags = listOf("camping", "stargazing", "nature")
            ),
            // Posts for sarah_williams
            Post(
                userId = "sarah_williams",
                userName = "Sarah Williams",
                userProfileImage = "https://picsum.photos/200/200?random=11",
                postImageUrl = "https://picsum.photos/600/600?random=54",
                description = "Yoga session at sunrise 🧘‍♀️ #yoga #wellness #mindfulness",
                likes = 63,
                timestamp = System.currentTimeMillis() - 3600000,
                likedBy = listOf("mike_chen", "jessica_brown", "alex_jones"),
                hashtags = listOf("yoga", "wellness", "mindfulness")
            ),
            Post(
                userId = "sarah_williams", 
                userName = "Sarah Williams",
                userProfileImage = "https://picsum.photos/200/200?random=11",
                postImageUrl = "https://picsum.photos/600/600?random=55",
                description = "Healthy breakfast bowl 🥗 Starting the day right!",
                likes = 45,
                timestamp = System.currentTimeMillis() - 259200000,
                likedBy = listOf("mike_chen", "david_wilson"),
                hashtags = listOf("healthy", "breakfast", "wellness")
            ),
            // Posts for alex_jones
            Post(
                userId = "alex_jones",
                userName = "Alex Jones", 
                userProfileImage = "https://picsum.photos/200/200?random=12",
                postImageUrl = "https://picsum.photos/600/600?random=56",
                description = "New street art piece I discovered today! 🎨 #streetart #urban",
                likes = 52,
                timestamp = System.currentTimeMillis() - 7200000,
                likedBy = listOf("sarah_williams", "jessica_brown"),
                hashtags = listOf("streetart", "urban", "art")
            ),
            Post(
                userId = "alex_jones",
                userName = "Alex Jones",
                userProfileImage = "https://picsum.photos/200/200?random=12", 
                postImageUrl = "https://picsum.photos/600/600?random=57",
                description = "Coffee shop vibes ☕ Perfect place to work",
                likes = 31,
                timestamp = System.currentTimeMillis() - 345600000,
                likedBy = listOf("mike_chen", "sarah_williams"),
                hashtags = listOf("coffee", "work", "lifestyle")
            ),
            // Posts for jessica_brown
            Post(
                userId = "jessica_brown",
                userName = "Jessica Brown",
                userProfileImage = "https://picsum.photos/200/200?random=13", 
                postImageUrl = "https://picsum.photos/600/600?random=58",
                description = "Beach day! 🏖️ Nothing beats the ocean breeze",
                likes = 78,
                timestamp = System.currentTimeMillis() - 432000000,
                likedBy = listOf("mike_chen", "sarah_williams", "alex_jones", "david_wilson"),
                hashtags = listOf("beach", "ocean", "vacation")
            ),
            Post(
                userId = "jessica_brown",
                userName = "Jessica Brown",
                userProfileImage = "https://picsum.photos/200/200?random=13",
                postImageUrl = "https://picsum.photos/600/600?random=59", 
                description = "Homemade pasta night � #cooking #foodie",
                likes = 39,
                timestamp = System.currentTimeMillis() - 518400000,
                likedBy = listOf("sarah_williams", "david_wilson"),
                hashtags = listOf("cooking", "foodie", "pasta")
            ),
            // Posts for david_wilson
            Post(
                userId = "david_wilson",
                userName = "David Wilson",
                userProfileImage = "https://picsum.photos/200/200?random=14",
                postImageUrl = "https://picsum.photos/600/600?random=60",
                description = "New book recommendation 📚 'The Power of Now' - life changing!",
                likes = 24,
                timestamp = System.currentTimeMillis() - 604800000,
                likedBy = listOf("sarah_williams", "alex_jones"),
                hashtags = listOf("books", "reading", "mindfulness")
            )
        )

        posts.forEach { post ->
            addPost(post) { success ->
                if (success) {
                    println("Sample post added successfully for ${post.userName}")
                } else {
                    println("Failed to add post for ${post.userName}")
                }
            }
        }
    }

    // Utility function to fix corrupted counter data
    fun syncFollowCounters(callback: (Boolean) -> Unit) {
        firestore.collection(USERS_COLLECTION)
            .get()
            .addOnSuccessListener { querySnapshot ->
                val batch = firestore.batch()
                
                for (document in querySnapshot.documents) {
                    val user = document.toObject(User::class.java)
                    if (user != null) {
                        val correctFollowersCount = user.followers.size.toLong()
                        val correctFollowingCount = user.following.size.toLong()
                        
                        batch.update(document.reference, mapOf(
                            "followersCount" to correctFollowersCount,
                            "followingCount" to correctFollowingCount
                        ))
                    }
                }
                
                batch.commit()
                    .addOnSuccessListener { callback(true) }
                    .addOnFailureListener { callback(false) }
            }
            .addOnFailureListener { callback(false) }
    }

    // Comments methods
    fun getCommentsForPost(postId: String, callback: (List<Comment>) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "🎯 getCommentsForPost called for postId: '$postId'")
        Log.d("FirebaseRepository", "🏠 Collection: $COMMENTS_COLLECTION")
        
        // Temporary: Remove orderBy to avoid composite index requirement
        val query = firestore.collection(COMMENTS_COLLECTION)
            .whereEqualTo("postId", postId)
            // .orderBy("timestamp", Query.Direction.ASCENDING) // Commented out to avoid index requirement
            
        Log.d("FirebaseRepository", "📊 Query: $query")
        Log.d("FirebaseRepository", "🔍 Looking for documents where postId == '$postId'")
        
        return query.addSnapshotListener { snapshot, exception ->
            Log.d("FirebaseRepository", "📨 Snapshot listener triggered!")
            
            if (exception != null) {
                Log.e("FirebaseRepository", "❌ Error getting comments: ${exception.message}")
                Log.e("FirebaseRepository", "❌ Exception cause: ${exception.cause}")
                exception.printStackTrace()
                callback(emptyList())
                return@addSnapshotListener
            }

            val documentCount = snapshot?.documents?.size ?: 0
            Log.d("FirebaseRepository", "✅ Query returned $documentCount documents")
            
            if (documentCount == 0) {
                Log.w("FirebaseRepository", "⚠️ No documents found for postId: '$postId'")
                Log.w("FirebaseRepository", "⚠️ This could mean:")
                Log.w("FirebaseRepository", "   1. No comments exist for this post")
                Log.w("FirebaseRepository", "   2. postId doesn't match any documents")
                Log.w("FirebaseRepository", "   3. Firestore rules blocking access")
            }

            val comments = snapshot?.documents?.mapNotNull { document ->
                try {
                    Log.d("FirebaseRepository", "📄 Processing document ID: ${document.id}")
                    val data = document.data
                    Log.d("FirebaseRepository", "📄 Document data: $data")
                    
                    val comment = document.toObject(Comment::class.java)?.copy(id = document.id)
                    Log.d("FirebaseRepository", "📝 Parsed comment: $comment")
                    comment
                } catch (e: Exception) {
                    Log.e("FirebaseRepository", "❌ Error parsing document ${document.id}: ${e.message}")
                    e.printStackTrace()
                    null
                }
            }?.sortedBy { it.timestamp } ?: emptyList() // Sort in code instead of Firestore

            Log.d("FirebaseRepository", "🚀 Returning ${comments.size} comments to callback")
            callback(comments)
        }
    }

    fun addComment(comment: Comment, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "addComment called with: $comment")
        Log.d("FirebaseRepository", "Adding to collection: $COMMENTS_COLLECTION")
        
        firestore.collection(COMMENTS_COLLECTION)
            .add(comment)
            .addOnSuccessListener { documentReference ->
                Log.d("FirebaseRepository", "Comment added successfully with ID: ${documentReference.id}")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Error adding comment: ${exception.message}")
                exception.printStackTrace()
                callback(false)
            }
    }

    fun deleteComment(commentId: String, callback: (Boolean) -> Unit) {
        firestore.collection(COMMENTS_COLLECTION)
            .document(commentId)
            .delete()
            .addOnSuccessListener {
                Log.d("FirebaseRepository", "Comment deleted successfully")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Error deleting comment: ${exception.message}")
                callback(false)
            }
    }
    
    // Utility method to get current user ID from Firebase Auth
    fun getCurrentUserId(): String? {
        val currentUser = auth.currentUser
        Log.d("FirebaseRepository", "getCurrentUserId - current user: ${currentUser?.uid}")
        return currentUser?.uid
    }
    
    // Get current user data
    fun getCurrentUser(callback: (User?) -> Unit) {
        val userId = getCurrentUserId()
        Log.d("FirebaseRepository", "getCurrentUser - userId: $userId")
        if (userId != null) {
            getUser(userId) { user ->
                Log.d("FirebaseRepository", "getCurrentUser - retrieved user: $user")
                callback(user)
            }
        } else {
            Log.d("FirebaseRepository", "getCurrentUser - userId is null")
            callback(null)
        }
    }
    
    fun saveStory(story: Story, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Saving story: ${story.id}")
        Log.d("FirebaseRepository", "Story data size - image URL length: ${story.storyImageUrl.length}")
        
        try {
            firestore.collection("stories")
                .document(story.id)
                .set(story)
                .addOnSuccessListener {
                    Log.d("FirebaseRepository", "Story saved successfully: ${story.id}")
                    callback(true)
                }
                .addOnFailureListener { e ->
                    Log.e("FirebaseRepository", "Error saving story: ${e.message}", e)
                    Log.e("FirebaseRepository", "Error details: ${e.cause}")
                    
                    // Log specific error types
                    when {
                        e.message?.contains("INVALID_ARGUMENT") == true -> {
                            Log.e("FirebaseRepository", "Invalid argument - possibly image too large")
                        }
                        e.message?.contains("DEADLINE_EXCEEDED") == true -> {
                            Log.e("FirebaseRepository", "Timeout - upload took too long")
                        }
                        e.message?.contains("PERMISSION_DENIED") == true -> {
                            Log.e("FirebaseRepository", "Permission denied - check Firestore rules")
                        }
                        else -> {
                            Log.e("FirebaseRepository", "Unknown error type")
                        }
                    }
                    
                    callback(false)
                }
        } catch (e: Exception) {
            Log.e("FirebaseRepository", "Exception creating story save request: ${e.message}", e)
            callback(false)
        }
    }
    
    /**
     * Upload story dengan base64 image dari canvas editor
     * @param base64Image Base64 string dari hasil export canvas 2-layer
     * @param callback Callback dengan success status
     */
    fun uploadStory(base64Image: String, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "uploadStory started")
        
        // Step 1: Get current user data dari collection "users"
        getCurrentUser { currentUser ->
            if (currentUser == null) {
                Log.e("FirebaseRepository", "uploadStory failed - no current user")
                callback(false)
                return@getCurrentUser
            }
            
            Log.d("FirebaseRepository", "uploadStory - current user: ${currentUser.username}")
            
            // Step 2: Generate story ID dengan format "story_<timestamp>"
            val timestamp = System.currentTimeMillis()
            val storyId = "story_$timestamp"
            Log.d("FirebaseRepository", "Generated story ID: $storyId")
            
            // Step 2.5: Add data URI prefix untuk konsistensi dengan story lama
            val dataUriImage = if (base64Image.startsWith("data:image/")) {
                base64Image // Sudah ada prefix
            } else {
                "data:image/jpeg;base64,$base64Image" // Tambahkan prefix
            }
            Log.d("FirebaseRepository", "Data URI image prepared for Firestore storage")
            
            // Step 3: Create story object dengan urutan field sesuai permintaan
            val story = Story(
                id = storyId,                           // 1. id = "story_<timestamp>"
                imageUrl = "",                          // 2. imageUrl = ""
                mainImageUrl = dataUriImage,            // 3. mainImageUrl = data URI untuk display
                storyImageUrl = dataUriImage,           // 4. storyImageUrl = sama dengan mainImageUrl
                text = "",                              // 5. text = ""
                timestamp = timestamp,                  // 6. timestamp = System.currentTimeMillis()
                userId = currentUser.id,                // 7. userId = dari FirebaseAuth
                userName = currentUser.username,        // 8. userName = nama user saat ini
                userProfileImage = currentUser.profileImageUrl, // 9. userProfileImage = foto profil user
                viewed = false,                         // 10. viewed = false
                viewedBy = emptyList()                  // 11. viewedBy = emptyList()
            )
            
            Log.d("FirebaseRepository", "Story object created with timestamp-based ID")
            Log.d("FirebaseRepository", "Story ID: ${story.id}")
            Log.d("FirebaseRepository", "Timestamp: ${story.timestamp}")
            Log.d("FirebaseRepository", "User: ${story.userName}")
            Log.d("FirebaseRepository", "Data URI image size: ${dataUriImage.length} chars")
            Log.d("FirebaseRepository", "Image has data URI prefix: ${dataUriImage.startsWith("data:image/")}")
            
            // Step 4: Save to Firestore collection "stories" dengan document ID sesuai storyId
            firestore.collection("stories")
                .document(storyId) // Gunakan storyId sebagai document ID
                .set(story)        // Gunakan .set(story) untuk menyimpan semua field termasuk id
                .addOnSuccessListener {
                    Log.d("FirebaseRepository", "uploadStory success - story ID: $storyId")
                    Log.d("FirebaseRepository", "Story saved to 'stories' collection with timestamp ID")
                    Log.d("FirebaseRepository", "Upload completed for user: ${currentUser.username}")
                    callback(true)
                }
                .addOnFailureListener { exception ->
                    Log.e("FirebaseRepository", "uploadStory failed for story ID: $storyId", exception)
                    Log.e("FirebaseRepository", "Failed for user: ${currentUser.username}")
                    callback(false)
                }
        }
    }

    fun deleteStory(storyId: String, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "deleteStory started for ID: $storyId")
        
        firestore.collection(STORIES_COLLECTION)
            .document(storyId)
            .delete()
            .addOnSuccessListener {
                Log.d("FirebaseRepository", "Story deleted successfully: $storyId")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "deleteStory failed for story ID: $storyId", exception)
                callback(false)
            }
    }
    
    // User management methods
    fun getUserRealTime(userId: String, callback: (User?) -> Unit): ListenerRegistration {
        return firestore.collection(USERS_COLLECTION)
            .document(userId)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "getUserRealTime error for user $userId", exception)
                    callback(null)
                    return@addSnapshotListener
                }

                val user = snapshot?.toObject(User::class.java)?.copy(id = snapshot.id)
                callback(user)
            }
    }
    
    fun getCurrentUserRealTime(callback: (User?) -> Unit): ListenerRegistration? {
        val currentUserId = auth.currentUser?.uid
        return if (currentUserId != null) {
            getUserRealTime(currentUserId, callback)
        } else {
            callback(null)
            null
        }
    }
    
    fun updateUserProfile(userId: String, updates: Map<String, Any>, callback: (Boolean) -> Unit) {
        firestore.collection(USERS_COLLECTION)
            .document(userId)
            .update(updates)
            .addOnSuccessListener {
                Log.d("FirebaseRepository", "User profile updated successfully: $userId")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "updateUserProfile failed for user $userId", exception)
                callback(false)
            }
    }
    
    fun getUserById(userId: String, callback: (User?) -> Unit) {
        firestore.collection(USERS_COLLECTION)
            .document(userId)
            .get()
            .addOnSuccessListener { document ->
                val user = document.toObject(User::class.java)?.copy(id = document.id)
                callback(user)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "getUserById failed for user $userId", exception)
                callback(null)
            }
    }
    
    fun getUsersByIds(userIds: List<String>, callback: (List<User>) -> Unit) {
        if (userIds.isEmpty()) {
            callback(emptyList())
            return
        }
        
        firestore.collection(USERS_COLLECTION)
            .whereIn("__name__", userIds) // Use document ID for query
            .get()
            .addOnSuccessListener { querySnapshot ->
                val users = querySnapshot.documents.mapNotNull { document ->
                    document.toObject(User::class.java)?.copy(id = document.id)
                }
                callback(users)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "getUsersByIds failed", exception)
                callback(emptyList())
            }
    }

    // Notification methods
    fun createNotification(notification: Notification, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Creating notification: ${notification.type} from ${notification.fromUserName} to ${notification.userId}")
        
        firestore.collection(NOTIFICATIONS_COLLECTION)
            .add(notification)
            .addOnSuccessListener { documentReference ->
                Log.d("FirebaseRepository", "Notification created successfully: ${documentReference.id}")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Failed to create notification", exception)
                callback(false)
            }
    }

    fun getUserNotifications(userId: String, callback: (List<Notification>) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "Getting notifications for user: $userId")
        
        return firestore.collection(NOTIFICATIONS_COLLECTION)
            .whereEqualTo("userId", userId)
            .limit(50) // Limit to recent 50 notifications
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error getting notifications", exception)
                    callback(emptyList())
                    return@addSnapshotListener
                }

                val notifications = snapshot?.documents?.mapNotNull { document ->
                    try {
                        Log.d("FirebaseRepository", "Processing document: ${document.id}")
                        Log.d("FirebaseRepository", "Document data: ${document.data}")
                        
                        val notification = document.toObject(Notification::class.java)?.copy(id = document.id)
                        Log.d("FirebaseRepository", "Parsed notification: $notification")
                        notification
                    } catch (e: Exception) {
                        Log.e("FirebaseRepository", "Error parsing notification: ${document.id}", e)
                        null
                    }
                }?.sortedByDescending { it.timestamp } ?: emptyList() // Sort manually by timestamp descending

                Log.d("FirebaseRepository", "Retrieved ${notifications.size} notifications")
                notifications.forEach { notification ->
                    Log.d("FirebaseRepository", "Notification: id=${notification.id}, type=${notification.type}, message=${notification.message}, fromUser=${notification.fromUserName}")
                }
                callback(notifications)
            }
    }

    fun getUnreadNotificationCount(userId: String, callback: (Int) -> Unit): ListenerRegistration {
        Log.d("FirebaseRepository", "Getting unread notification count for user: $userId")
        
        return firestore.collection(NOTIFICATIONS_COLLECTION)
            .whereEqualTo("userId", userId)
            .whereEqualTo("isRead", false)
            .addSnapshotListener { snapshot, exception ->
                if (exception != null) {
                    Log.e("FirebaseRepository", "Error getting unread count", exception)
                    callback(0)
                    return@addSnapshotListener
                }

                val count = snapshot?.size() ?: 0
                Log.d("FirebaseRepository", "Unread notifications count: $count")
                callback(count)
            }
    }

    fun markNotificationAsRead(notificationId: String, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Marking notification as read: $notificationId")
        
        firestore.collection(NOTIFICATIONS_COLLECTION)
            .document(notificationId)
            .update("isRead", true)
            .addOnSuccessListener {
                Log.d("FirebaseRepository", "Notification marked as read")
                callback(true)
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Failed to mark notification as read", exception)
                callback(false)
            }
    }

    fun markAllNotificationsAsRead(userId: String, callback: (Boolean) -> Unit) {
        Log.d("FirebaseRepository", "Marking all notifications as read for user: $userId")
        
        // Get all unread notifications for the user
        firestore.collection(NOTIFICATIONS_COLLECTION)
            .whereEqualTo("userId", userId)
            .whereEqualTo("isRead", false)
            .get()
            .addOnSuccessListener { querySnapshot ->
                // Batch update all notifications
                val batch = firestore.batch()
                
                querySnapshot.documents.forEach { document ->
                    batch.update(document.reference, "isRead", true)
                }
                
                batch.commit()
                    .addOnSuccessListener {
                        Log.d("FirebaseRepository", "All notifications marked as read")
                        callback(true)
                    }
                    .addOnFailureListener { exception ->
                        Log.e("FirebaseRepository", "Failed to mark all notifications as read", exception)
                        callback(false)
                    }
            }
            .addOnFailureListener { exception ->
                Log.e("FirebaseRepository", "Failed to get unread notifications", exception)
                callback(false)
            }
    }

    // Helper method to create like notification
    fun createLikeNotification(postOwnerId: String, likerUserId: String, likerUserName: String, likerProfileImage: String, postId: String, postImageUrl: String) {
        // Don't create notification if user likes their own post
        if (postOwnerId == likerUserId) return
        
        val notification = Notification(
            userId = postOwnerId,
            type = NotificationTypes.LIKE,
            fromUserId = likerUserId,
            fromUserName = likerUserName,
            fromUserProfileImage = likerProfileImage,
            postId = postId,
            postImageUrl = postImageUrl,
            timestamp = System.currentTimeMillis()
        )
        
        createNotification(notification) { success ->
            if (success) {
                Log.d("FirebaseRepository", "Like notification created successfully")
            }
        }
    }

    // Helper method to create follow notification
    fun createFollowNotification(followedUserId: String, followerUserId: String, followerUserName: String, followerProfileImage: String) {
        // Don't create notification if user follows themselves (shouldn't happen but just in case)
        if (followedUserId == followerUserId) return
        
        val notification = Notification(
            userId = followedUserId,
            type = NotificationTypes.FOLLOW,
            fromUserId = followerUserId,
            fromUserName = followerUserName,
            fromUserProfileImage = followerProfileImage,
            timestamp = System.currentTimeMillis()
        )
        
        createNotification(notification) { success ->
            if (success) {
                Log.d("FirebaseRepository", "Follow notification created successfully")
            }
        }
    }

    // Get followers list
    fun getFollowers(userId: String, callback: (List<User>) -> Unit) {
        getUserById(userId) { user ->
            if (user != null) {
                val followerIds = user.followers
                if (followerIds.isEmpty()) {
                    callback(emptyList())
                    return@getUserById
                }
                
                // Get user details for each follower ID
                val followers = mutableListOf<User>()
                var processedCount = 0
                
                followerIds.forEach { followerId ->
                    getUserById(followerId) { followerUser ->
                        processedCount++
                        if (followerUser != null) {
                            followers.add(followerUser)
                        }
                        
                        // When all followers are processed, return the list
                        if (processedCount == followerIds.size) {
                            // Sort by fullName for consistent ordering
                            callback(followers.sortedBy { it.fullName.ifEmpty { it.displayName } })
                        }
                    }
                }
            } else {
                callback(emptyList())
            }
        }
    }

    // Get following list
    fun getFollowing(userId: String, callback: (List<User>) -> Unit) {
        getUserById(userId) { user ->
            if (user != null) {
                val followingIds = user.following
                if (followingIds.isEmpty()) {
                    callback(emptyList())
                    return@getUserById
                }
                
                // Get user details for each following ID
                val following = mutableListOf<User>()
                var processedCount = 0
                
                followingIds.forEach { followingId ->
                    getUserById(followingId) { followingUser ->
                        processedCount++
                        if (followingUser != null) {
                            following.add(followingUser)
                        }
                        
                        // When all following users are processed, return the list
                        if (processedCount == followingIds.size) {
                            // Sort by fullName for consistent ordering
                            callback(following.sortedBy { it.fullName.ifEmpty { it.displayName } })
                        }
                    }
                }
            } else {
                callback(emptyList())
            }
        }
    }

    // Check if current user is following another user
    fun isFollowing(currentUserId: String, targetUserId: String, callback: (Boolean) -> Unit) {
        getUserById(currentUserId) { user ->
            callback(user?.following?.contains(targetUserId) == true)
        }
    }


}
