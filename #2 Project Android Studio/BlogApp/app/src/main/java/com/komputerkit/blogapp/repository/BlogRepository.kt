package com.komputerkit.blogapp.repository

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.komputerkit.blogapp.data.BlogPost
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Date

class BlogRepository {
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    suspend fun createPost(title: String, content: String, imageBase64: String? = null): Result<String> {
        return try {
            val currentUser = auth.currentUser ?: return Result.failure(Exception("User not logged in"))
            
            // Get author name and profile image from Firestore user document for more reliable data
            var authorName = "Anonymous"
            var authorProfileImage = ""
            try {
                val userDoc = firestore.collection("users").document(currentUser.uid).get().await()
                if (userDoc.exists()) {
                    val userData = userDoc.data
                    authorName = userData?.get("displayName") as? String 
                        ?: currentUser.displayName 
                        ?: currentUser.email?.substringBefore("@") 
                        ?: "Anonymous"
                    authorProfileImage = userData?.get("profileImageBase64") as? String ?: ""
                    Log.d("BlogRepository", "Author name from Firestore: $authorName")
                    Log.d("BlogRepository", "Author profile image found: ${authorProfileImage.isNotEmpty()}")
                } else {
                    // Fallback to Firebase Auth data
                    authorName = currentUser.displayName 
                        ?: currentUser.email?.substringBefore("@") 
                        ?: "Anonymous"
                    Log.d("BlogRepository", "Author name from Firebase Auth: $authorName")
                }
            } catch (e: Exception) {
                Log.e("BlogRepository", "Error getting user data, using fallback", e)
                authorName = currentUser.displayName 
                    ?: currentUser.email?.substringBefore("@") 
                    ?: "Anonymous"
            }
            
            Log.d("BlogRepository", "Creating post with author name: $authorName")
            Log.d("BlogRepository", "Post image: ${if (imageBase64.isNullOrEmpty()) "No image" else "Image present (${imageBase64.length} chars)"}")
            
            val post = BlogPost(
                title = title,
                content = content,
                authorName = authorName,
                authorId = currentUser.uid,
                authorProfileImage = authorProfileImage,
                imageUrl = imageBase64 ?: "", // Set the blog post image
                createdAt = Date(),
                updatedAt = Date()
            )
            
            val docRef = firestore.collection("posts").add(post).await()
            Log.d("BlogRepository", "Post created successfully with ID: ${docRef.id}")
            Result.success(docRef.id)
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error creating post", e)
            Result.failure(e)
        }
    }

    fun getAllPosts(): Flow<List<BlogPost>> = callbackFlow {
        try {
            val listener = firestore.collection("posts")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("BlogRepository", "Error loading posts: ${error.message}", error)
                        // Don't close the flow, just send empty list
                        trySend(emptyList())
                        return@addSnapshotListener
                    }
                    
                    try {
                        val posts = snapshot?.toObjects(BlogPost::class.java) ?: emptyList()
                        trySend(posts)
                    } catch (e: Exception) {
                        Log.e("BlogRepository", "Error parsing posts: ${e.message}", e)
                        trySend(emptyList())
                    }
                }
            awaitClose { listener.remove() }
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error setting up posts listener: ${e.message}", e)
            trySend(emptyList())
            close()
        }
    }

    fun getUserPosts(userId: String): Flow<List<BlogPost>> = callbackFlow {
        try {
            Log.d("BlogRepository", "Setting up getUserPosts listener for userId: $userId")
            val listener = firestore.collection("posts")
                .whereEqualTo("authorId", userId)
                // .orderBy("createdAt", Query.Direction.DESCENDING) // Removed to avoid composite index requirement
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("BlogRepository", "Error loading user posts: ${error.message}", error)
                        // Don't close the flow, just send empty list
                        trySend(emptyList())
                        return@addSnapshotListener
                    }
                    
                    try {
                        val posts = snapshot?.toObjects(BlogPost::class.java) ?: emptyList()
                        Log.d("BlogRepository", "=== USER POSTS QUERY RESULT ===")
                        Log.d("BlogRepository", "Found ${posts.size} posts for user $userId")
                        posts.forEachIndexed { index, post ->
                            Log.d("BlogRepository", "Post $index: id=${post.id}, title='${post.title}', authorId=${post.authorId}")
                        }
                        // Sort in memory to avoid composite index requirement
                        val sortedPosts = posts.sortedByDescending { it.createdAt }
                        Log.d("BlogRepository", "Sending ${sortedPosts.size} sorted posts")
                        trySend(sortedPosts)
                    } catch (e: Exception) {
                        Log.e("BlogRepository", "Error parsing user posts: ${e.message}", e)
                        trySend(emptyList())
                    }
                }
            awaitClose { listener.remove() }
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error setting up user posts listener: ${e.message}", e)
            trySend(emptyList())
            close()
        }
    }

    // Add method to get posts by author name as fallback
    fun getUserPostsByAuthorName(authorName: String): Flow<List<BlogPost>> = callbackFlow {
        try {
            Log.d("BlogRepository", "Setting up getUserPostsByAuthorName listener for authorName: $authorName")
            val listener = firestore.collection("posts")
                .whereEqualTo("authorName", authorName)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("BlogRepository", "Error loading posts by author name: ${error.message}", error)
                        trySend(emptyList())
                        return@addSnapshotListener
                    }
                    
                    try {
                        val posts = snapshot?.toObjects(BlogPost::class.java) ?: emptyList()
                        Log.d("BlogRepository", "=== POSTS BY AUTHOR NAME RESULT ===")
                        Log.d("BlogRepository", "Found ${posts.size} posts for author name '$authorName'")
                        posts.forEachIndexed { index, post ->
                            Log.d("BlogRepository", "Post $index: id=${post.id}, title='${post.title}', authorId=${post.authorId}, authorName=${post.authorName}")
                        }
                        val sortedPosts = posts.sortedByDescending { it.createdAt }
                        trySend(sortedPosts)
                    } catch (e: Exception) {
                        Log.e("BlogRepository", "Error parsing posts by author name: ${e.message}", e)
                        trySend(emptyList())
                    }
                }
            awaitClose { listener.remove() }
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error setting up posts by author name listener: ${e.message}", e)
            trySend(emptyList())
            close()
        }
    }

    // Method to fix orphaned posts - update authorId for posts with matching authorName
    suspend fun fixOrphanedPosts(currentUserId: String, currentUserName: String): Result<Int> {
        return try {
            Log.d("BlogRepository", "Starting to fix orphaned posts for user: $currentUserId, name: $currentUserName")
            
            // Find posts with matching authorName but different authorId
            val orphanedPosts = firestore.collection("posts")
                .whereEqualTo("authorName", currentUserName)
                .get()
                .await()
                .toObjects(BlogPost::class.java)
                .filter { it.authorId != currentUserId }
            
            Log.d("BlogRepository", "Found ${orphanedPosts.size} orphaned posts to fix")
            
            var fixedCount = 0
            for (post in orphanedPosts) {
                try {
                    Log.d("BlogRepository", "Fixing post: ${post.id} - '${post.title}' (old authorId: ${post.authorId})")
                    firestore.collection("posts")
                        .document(post.id)
                        .update("authorId", currentUserId)
                        .await()
                    fixedCount++
                    Log.d("BlogRepository", "Successfully fixed post: ${post.id}")
                } catch (e: Exception) {
                    Log.e("BlogRepository", "Failed to fix post ${post.id}: ${e.message}", e)
                }
            }
            
            Log.d("BlogRepository", "Fixed $fixedCount out of ${orphanedPosts.size} orphaned posts")
            Result.success(fixedCount)
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error fixing orphaned posts: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updatePost(postId: String, title: String, content: String, imageBase64: String? = null): Result<Unit> {
        return try {
            val currentUser = auth.currentUser ?: return Result.failure(Exception("User not logged in"))
            
            val updateData = mutableMapOf<String, Any>(
                "title" to title,
                "content" to content,
                "updatedAt" to Date()
            )
            
            // Add image if provided, or explicitly set to empty string if null to remove image
            imageBase64?.let { 
                updateData["imageUrl"] = it
            } ?: run {
                updateData["imageUrl"] = ""
            }
            
            Log.d("BlogRepository", "Updating post $postId with image: ${if (imageBase64.isNullOrEmpty()) "REMOVED/NONE" else "PROVIDED (${imageBase64.length} chars)"}")
            
            firestore.collection("posts").document(postId)
                .update(updateData).await()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error updating post", e)
            Result.failure(e)
        }
    }

    suspend fun deletePost(postId: String): Result<Unit> {
        return try {
            firestore.collection("posts").document(postId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPostById(postId: String): Result<BlogPost> {
        return try {
            val document = firestore.collection("posts").document(postId).get().await()
            val post = document.toObject(BlogPost::class.java)
            if (post != null) {
                Result.success(post.copy(id = document.id))
            } else {
                Result.failure(Exception("Post not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleLike(postId: String): Result<Boolean> {
        return try {
            val currentUser = auth.currentUser ?: return Result.failure(Exception("User not logged in"))
            val userId = currentUser.uid
            
            val postRef = firestore.collection("posts").document(postId)
            
            firestore.runTransaction { transaction ->
                val postSnapshot = transaction.get(postRef)
                val post = postSnapshot.toObject(BlogPost::class.java)
                
                if (post != null) {
                    val currentLikedBy = post.likedBy.toMutableList()
                    val isLiked = currentLikedBy.contains(userId)
                    
                    if (isLiked) {
                        currentLikedBy.remove(userId)
                    } else {
                        currentLikedBy.add(userId)
                    }
                    
                    transaction.update(postRef, mapOf(
                        "likedBy" to currentLikedBy,
                        "likeCount" to currentLikedBy.size
                    ))
                    
                    !isLiked // Return new like status
                } else {
                    throw Exception("Post not found")
                }
            }.await()
            
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleSave(postId: String): Result<Boolean> {
        return try {
            val currentUser = auth.currentUser ?: return Result.failure(Exception("User not logged in"))
            val userId = currentUser.uid
            
            val postRef = firestore.collection("posts").document(postId)
            
            firestore.runTransaction { transaction ->
                val postSnapshot = transaction.get(postRef)
                val post = postSnapshot.toObject(BlogPost::class.java)
                
                if (post != null) {
                    val currentSavedBy = post.savedBy.toMutableList()
                    val isSaved = currentSavedBy.contains(userId)
                    
                    if (isSaved) {
                        currentSavedBy.remove(userId)
                    } else {
                        currentSavedBy.add(userId)
                    }
                    
                    transaction.update(postRef, mapOf(
                        "savedBy" to currentSavedBy
                    ))
                    
                    !isSaved // Return new save status
                } else {
                    throw Exception("Post not found")
                }
            }.await()
            
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getSavedPosts(userId: String): Flow<List<BlogPost>> = callbackFlow {
        try {
            val listener = firestore.collection("posts")
                .whereArrayContains("savedBy", userId)
                // Temporarily remove orderBy to avoid composite index requirement
                // .orderBy("createdAt", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("BlogRepository", "Error loading saved posts: ${error.message}", error)
                        // Don't close the flow, just send empty list
                        trySend(emptyList())
                        return@addSnapshotListener
                    }
                    
                    try {
                        val posts = snapshot?.toObjects(BlogPost::class.java) ?: emptyList()
                        // Sort in memory instead of database
                        val sortedPosts = posts.sortedByDescending { it.createdAt }
                        trySend(sortedPosts)
                    } catch (e: Exception) {
                        Log.e("BlogRepository", "Error parsing saved posts: ${e.message}", e)
                        trySend(emptyList())
                    }
                }
            awaitClose { listener.remove() }
        } catch (e: Exception) {
            Log.e("BlogRepository", "Error setting up saved posts listener: ${e.message}", e)
            trySend(emptyList())
            close()
        }
    }

    suspend fun updateUserPostsProfile(userId: String, newDisplayName: String, newProfileImage: String): Result<Unit> {
        return try {
            Log.d("BlogRepository", "=== UPDATING ALL USER POSTS PROFILE ===")
            Log.d("BlogRepository", "User ID: $userId")
            Log.d("BlogRepository", "New display name: $newDisplayName")
            Log.d("BlogRepository", "New profile image length: ${newProfileImage.length}")
            
            // Get all posts by this user
            val querySnapshot = firestore.collection("posts")
                .whereEqualTo("authorId", userId)
                .get()
                .await()
            
            Log.d("BlogRepository", "Found ${querySnapshot.documents.size} posts to update")
            
            if (querySnapshot.documents.isNotEmpty()) {
                // Use batch write for better performance and atomicity
                val batch = firestore.batch()
                
                querySnapshot.documents.forEach { document ->
                    val postRef = firestore.collection("posts").document(document.id)
                    Log.d("BlogRepository", "Updating post: ${document.id} - ${document.getString("title")}")
                    
                    batch.update(postRef, mapOf(
                        "authorName" to newDisplayName,
                        "authorProfileImage" to newProfileImage,
                        "updatedAt" to Date()
                    ))
                }
                
                // Execute batch update
                batch.commit().await()
                Log.d("BlogRepository", "✅ Successfully updated ${querySnapshot.documents.size} posts")
            } else {
                Log.d("BlogRepository", "No posts found to update")
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BlogRepository", "❌ Failed to update user posts profile", e)
            Result.failure(e)
        }
    }
}
