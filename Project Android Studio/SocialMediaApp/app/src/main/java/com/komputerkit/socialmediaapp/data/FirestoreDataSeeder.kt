package com.komputerkit.socialmediaapp.data

import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.model.Notification

class FirestoreDataSeeder {
    private val firestore = FirebaseFirestore.getInstance()
    
    fun seedData() {
        ensureCurrentUserExists() // Ensure current_user exists first
        createSampleUsers()
        createSamplePosts()
        createSampleStories()
        createSampleNotifications()
    }
    
    fun clearData() {
        // Clear all collections
        clearCollection("users")
        clearCollection("posts")
        clearCollection("stories")
        clearCollection("notifications")
    }
    
    fun updateExistingStories() {
        // Update any existing stories that have incorrect user data
        val actualUserId = "W8Du9AcqQHZvqjkoo6ucTUlNgRe2"
        
        firestore.collection("stories")
            .whereEqualTo("userId", actualUserId)
            .get()
            .addOnSuccessListener { querySnapshot ->
                for (document in querySnapshot.documents) {
                    // Update the story with proper user data
                    val updates = mapOf(
                        "userName" to "Current User",
                        "userProfileImage" to "https://i.pravatar.cc/150?u=current_user"
                    )
                    document.reference.update(updates)
                        .addOnSuccessListener {
                            println("Updated story ${document.id} for user $actualUserId")
                        }
                        .addOnFailureListener { e ->
                            println("Error updating story ${document.id}: $e")
                        }
                }
            }
            .addOnFailureListener { e ->
                println("Error querying stories: $e")
            }
    }
    
    fun ensureCurrentUserExists() {
        // Ensure current_user exists in database with the actual userId
        val actualUserId = "W8Du9AcqQHZvqjkoo6ucTUlNgRe2"
        val currentUser = User(
            id = actualUserId,
            username = "current_user",
            email = "current@example.com",
            fullName = "Current User",
            displayName = "Current User",
            profileImageUrl = "https://i.pravatar.cc/150?u=current_user",
            bio = "Main user account for testing stories and posts 📱",
            followers = listOf("john_doe", "sarah_wilson"),
            following = listOf("john_doe", "sarah_wilson", "mike_chen"),
            followersCount = 2L,
            followingCount = 3L,
            postsCount = 1L,
            isVerified = true,
            createdAt = System.currentTimeMillis()
        )
        
        firestore.collection("users")
            .document(actualUserId)
            .set(currentUser)
            .addOnSuccessListener {
                println("Current user created/updated successfully with ID: $actualUserId")
            }
            .addOnFailureListener { e ->
                println("Error creating current user: $e")
            }
    }
    
    private fun clearCollection(collectionName: String) {
        firestore.collection(collectionName)
            .get()
            .addOnSuccessListener { querySnapshot ->
                for (document in querySnapshot.documents) {
                    document.reference.delete()
                }
                println("Cleared collection: $collectionName")
            }
            .addOnFailureListener { e ->
                println("Error clearing collection $collectionName: $e")
            }
    }
    
    private fun createSampleUsers() {
        val actualUserId = "W8Du9AcqQHZvqjkoo6ucTUlNgRe2"
        
        val users = listOf(
            User(
                id = "john_doe",
                username = "john_doe",
                email = "john.doe@example.com",
                fullName = "John Doe",
                profileImageUrl = "https://i.pravatar.cc/150?u=john_doe",
                bio = "Software Developer | Photography enthusiast 📸 | Coffee lover ☕",
                followers = listOf(actualUserId, "sarah_wilson", "mike_chen", "emma_garcia"),
                following = listOf("sarah_wilson", "mike_chen", "david_kim"),
                isVerified = true,
                createdAt = System.currentTimeMillis() - 86400000 * 30
            ),
            User(
                id = "sarah_wilson",
                username = "sarah_wilson",
                email = "sarah.wilson@example.com",
                fullName = "Sarah Wilson",
                profileImageUrl = "https://i.pravatar.cc/150?u=sarah_wilson",
                bio = "UI/UX Designer | Digital artist 🎨 | Creating beautiful experiences",
                followers = listOf(actualUserId, "john_doe", "mike_chen", "david_kim"),
                following = listOf(actualUserId, "john_doe", "emma_garcia"),
                isVerified = true,
                createdAt = System.currentTimeMillis() - 86400000 * 25
            ),
            User(
                id = "mike_chen",
                username = "mike_chen",
                email = "mike.chen@example.com",
                fullName = "Mike Chen",
                profileImageUrl = "https://i.pravatar.cc/150?u=mike_chen",
                bio = "Adventure seeker 🏔️ | Travel blogger | Living life one hike at a time",
                followers = listOf("john_doe", "sarah_wilson", "emma_garcia", "david_kim"),
                following = listOf("john_doe", "sarah_wilson"),
                isVerified = false,
                createdAt = System.currentTimeMillis() - 86400000 * 20
            ),
            User(
                id = "emma_garcia",
                username = "emma_garcia",
                email = "emma.garcia@example.com",
                fullName = "Emma Garcia",
                profileImageUrl = "https://i.pravatar.cc/150?u=emma_garcia",
                bio = "Chef & Food blogger 👩‍🍳 | Sharing recipes & culinary adventures",
                followers = listOf("mike_chen", "david_kim"),
                following = listOf("john_doe", "sarah_wilson", "mike_chen"),
                isVerified = true,
                createdAt = System.currentTimeMillis() - 86400000 * 15
            ),
            User(
                id = "david_kim",
                username = "david_kim",
                email = "david.kim@example.com",
                fullName = "David Kim",
                profileImageUrl = "https://i.pravatar.cc/150?u=david_kim",
                bio = "Book lover 📚 | Writer | Sharing stories and literary thoughts",
                followers = listOf("sarah_wilson", "emma_garcia"),
                following = listOf("john_doe", "mike_chen", "emma_garcia"),
                isVerified = false,
                createdAt = System.currentTimeMillis() - 86400000 * 10
            )
        )
        
        users.forEach { user ->
            firestore.collection("users")
                .document(user.id)
                .set(user)
                .addOnSuccessListener {
                    println("User ${user.username} created successfully")
                }
                .addOnFailureListener { e ->
                    println("Error creating user ${user.username}: $e")
                }
        }
    }
    
    private fun createSamplePosts() {
        val posts = listOf(
            Post(
                id = "post1",
                userId = "john_doe",
                userName = "John Doe",
                userProfileImage = "https://i.pravatar.cc/150?u=john_doe",
                postImageUrl = "https://picsum.photos/600/400?random=1",
                description = "Beautiful sunset at the beach! 🌅 #sunset #beach #photography",
                likes = 42L,
                timestamp = System.currentTimeMillis() - 3600000, // 1 hour ago
                likedBy = listOf("sarah_wilson", "mike_chen", "emma_garcia"),
                hashtags = listOf("#sunset", "#beach", "#photography")
            ),
            Post(
                id = "post2",
                userId = "sarah_wilson",
                userName = "Sarah Wilson",
                userProfileImage = "https://i.pravatar.cc/150?u=sarah_wilson",
                postImageUrl = "https://picsum.photos/600/400?random=2",
                description = "Amazing coffee art this morning ☕️ Starting the day right! #coffee #art #morning",
                likes = 27L,
                timestamp = System.currentTimeMillis() - 7200000, // 2 hours ago
                likedBy = listOf("john_doe", "mike_chen"),
                hashtags = listOf("#coffee", "#art", "#morning")
            ),
            Post(
                id = "post3",
                userId = "mike_chen",
                userName = "Mike Chen",
                userProfileImage = "https://i.pravatar.cc/150?u=mike_chen",
                postImageUrl = "https://picsum.photos/600/400?random=3",
                description = "Weekend hiking adventure 🥾 Nature is the best therapy #hiking #nature #weekend",
                likes = 63L,
                timestamp = System.currentTimeMillis() - 10800000, // 3 hours ago
                likedBy = listOf("john_doe", "sarah_wilson", "emma_garcia", "david_kim"),
                hashtags = listOf("#hiking", "#nature", "#weekend")
            ),
            Post(
                id = "post4",
                userId = "emma_garcia",
                userName = "Emma Garcia",
                userProfileImage = "https://i.pravatar.cc/150?u=emma_garcia",
                postImageUrl = "https://picsum.photos/600/400?random=4",
                description = "Homemade pasta for dinner tonight 🍝 Cooking is my passion! #cooking #pasta #homemade",
                likes = 35L,
                timestamp = System.currentTimeMillis() - 14400000, // 4 hours ago
                likedBy = listOf("john_doe", "sarah_wilson", "david_kim"),
                hashtags = listOf("#cooking", "#pasta", "#homemade")
            ),
            Post(
                id = "post5",
                userId = "david_kim",
                userName = "David Kim",
                userProfileImage = "https://i.pravatar.cc/150?u=david_kim",
                postImageUrl = "https://picsum.photos/600/400?random=5",
                description = "New book recommendation 📚 This one kept me up all night! #reading #books #literature",
                likes = 28L,
                timestamp = System.currentTimeMillis() - 18000000, // 5 hours ago
                likedBy = listOf("sarah_wilson", "emma_garcia"),
                hashtags = listOf("#reading", "#books", "#literature")
            ),
            Post(
                id = "post6",
                userId = "john_doe",
                userName = "John Doe",
                userProfileImage = "https://i.pravatar.cc/150?u=john_doe",
                postImageUrl = "https://picsum.photos/600/400?random=6",
                description = "Late night coding session 💻 Building something amazing! #coding #tech #developer",
                likes = 54L,
                timestamp = System.currentTimeMillis() - 21600000, // 6 hours ago
                likedBy = listOf("sarah_wilson", "mike_chen", "emma_garcia", "david_kim"),
                hashtags = listOf("#coding", "#tech", "#developer")
            )
        )
        
        posts.forEach { post ->
            firestore.collection("posts")
                .document(post.id)
                .set(post)
                .addOnSuccessListener {
                    println("Post ${post.id} created successfully")
                }
                .addOnFailureListener { e ->
                    println("Error creating post ${post.id}: $e")
                }
        }
    }
    
    private fun createSampleStories() {
        val actualUserId = "W8Du9AcqQHZvqjkoo6ucTUlNgRe2"
        
        val stories = listOf(
            Story(
                id = "story_current_1",
                userId = actualUserId,
                userName = "Current User",
                userProfileImage = "https://i.pravatar.cc/150?u=current_user",
                storyImageUrl = "https://picsum.photos/400/600?random=21",
                timestamp = System.currentTimeMillis() - 900000, // 15 minutes ago
                viewed = false
            ),
            Story(
                id = "story_current_2", 
                userId = actualUserId,
                userName = "Current User",
                userProfileImage = "https://i.pravatar.cc/150?u=current_user",
                storyImageUrl = "https://picsum.photos/400/600?random=22",
                timestamp = System.currentTimeMillis() - 600000, // 10 minutes ago
                viewed = false
            ),
            Story(
                id = "story1",
                userId = "john_doe",
                userName = "John Doe",
                userProfileImage = "https://i.pravatar.cc/150?u=john_doe",
                storyImageUrl = "https://picsum.photos/400/600?random=11",
                timestamp = System.currentTimeMillis() - 1800000, // 30 minutes ago
                viewed = false
            ),
            Story(
                id = "story2",
                userId = "sarah_wilson",
                userName = "Sarah Wilson",
                userProfileImage = "https://i.pravatar.cc/150?u=sarah_wilson",
                storyImageUrl = "https://picsum.photos/400/600?random=12",
                timestamp = System.currentTimeMillis() - 3600000, // 1 hour ago
                viewed = true
            ),
            Story(
                id = "story3",
                userId = "mike_chen",
                userName = "Mike Chen",
                userProfileImage = "https://i.pravatar.cc/150?u=mike_chen",
                storyImageUrl = "https://picsum.photos/400/600?random=13",
                timestamp = System.currentTimeMillis() - 5400000, // 1.5 hours ago
                viewed = false
            ),
            Story(
                id = "story4",
                userId = "emma_garcia",
                userName = "Emma Garcia",
                userProfileImage = "https://i.pravatar.cc/150?u=emma_garcia",
                storyImageUrl = "https://picsum.photos/400/600?random=14",
                timestamp = System.currentTimeMillis() - 7200000, // 2 hours ago
                viewed = true
            ),
            Story(
                id = "story5",
                userId = "david_kim",
                userName = "David Kim",
                userProfileImage = "https://i.pravatar.cc/150?u=david_kim",
                storyImageUrl = "https://picsum.photos/400/600?random=15",
                timestamp = System.currentTimeMillis() - 9000000, // 2.5 hours ago
                viewed = false
            )
        )
        
        stories.forEach { story ->
            firestore.collection("stories")
                .document(story.id)
                .set(story)
                .addOnSuccessListener {
                    println("Story ${story.id} created successfully")
                }
                .addOnFailureListener { e ->
                    println("Error creating story ${story.id}: $e")
                }
        }
    }
    
    private fun createSampleNotifications() {
        val notifications = listOf(
            Notification(
                id = "notif1",
                userId = "john_doe",
                type = "like",
                message = "Sarah Wilson liked your post",
                timestamp = System.currentTimeMillis() - 1800000, // 30 minutes ago
                isRead = false,
                fromUserId = "sarah_wilson",
                fromUserName = "Sarah Wilson",
                fromUserProfileImage = "https://i.pravatar.cc/150?u=sarah_wilson",
                postId = "post1",
                postImageUrl = "https://picsum.photos/600/400?random=1"
            ),
            Notification(
                id = "notif2",
                userId = "sarah_wilson",
                type = "comment",
                message = "Mike Chen commented on your post",
                timestamp = System.currentTimeMillis() - 3600000, // 1 hour ago
                isRead = true,
                fromUserId = "mike_chen",
                fromUserName = "Mike Chen",
                fromUserProfileImage = "https://i.pravatar.cc/150?u=mike_chen",
                postId = "post2",
                postImageUrl = "https://picsum.photos/600/400?random=2"
            ),
            Notification(
                id = "notif3",
                userId = "mike_chen",
                type = "follow",
                message = "Emma Garcia started following you",
                timestamp = System.currentTimeMillis() - 5400000, // 1.5 hours ago
                isRead = false,
                fromUserId = "emma_garcia",
                fromUserName = "Emma Garcia",
                fromUserProfileImage = "https://i.pravatar.cc/150?u=emma_garcia",
                postId = null,
                postImageUrl = null
            ),
            Notification(
                id = "notif4",
                userId = "emma_garcia",
                type = "mention",
                message = "David Kim mentioned you in a comment",
                timestamp = System.currentTimeMillis() - 7200000, // 2 hours ago
                isRead = true,
                fromUserId = "david_kim",
                fromUserName = "David Kim",
                fromUserProfileImage = "https://i.pravatar.cc/150?u=david_kim",
                postId = "post4",
                postImageUrl = "https://picsum.photos/600/400?random=4"
            ),
            Notification(
                id = "notif5",
                userId = "david_kim",
                type = "like",
                message = "John Doe liked your post",
                timestamp = System.currentTimeMillis() - 9000000, // 2.5 hours ago
                isRead = false,
                fromUserId = "john_doe",
                fromUserName = "John Doe",
                fromUserProfileImage = "https://i.pravatar.cc/150?u=john_doe",
                postId = "post5",
                postImageUrl = "https://picsum.photos/600/400?random=5"
            )
        )
        
        notifications.forEach { notification ->
            firestore.collection("notifications")
                .document(notification.id)
                .set(notification)
                .addOnSuccessListener {
                    println("Notification ${notification.id} created successfully")
                }
                .addOnFailureListener { e ->
                    println("Error creating notification ${notification.id}: $e")
                }
        }
    }
}
