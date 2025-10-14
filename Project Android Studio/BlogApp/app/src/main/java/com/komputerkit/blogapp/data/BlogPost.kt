package com.komputerkit.blogapp.data

import com.google.firebase.firestore.DocumentId
import java.util.Date

data class BlogPost(
    @DocumentId
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val authorName: String = "",
    val authorId: String = "",
    val authorProfileImage: String = "", // Base64 encoded profile image
    val imageUrl: String = "", // Base64 encoded blog post image (optional)
    val createdAt: Date = Date(),
    val updatedAt: Date = Date(),
    val excerpt: String = "",
    val likeCount: Int = 0,
    val likedBy: List<String> = emptyList(),
    val savedBy: List<String> = emptyList()
) {
    // Generate excerpt from content if not provided
    fun getDisplayExcerpt(): String {
        return if (excerpt.isNotEmpty()) {
            excerpt
        } else {
            if (content.length > 150) {
                content.substring(0, 150) + "..."
            } else {
                content
            }
        }
    }
}
