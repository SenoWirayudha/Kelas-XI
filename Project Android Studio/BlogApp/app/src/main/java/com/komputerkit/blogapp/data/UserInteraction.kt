package com.komputerkit.blogapp.data

import com.google.firebase.firestore.DocumentId
import java.util.Date

data class UserInteraction(
    @DocumentId
    val id: String = "",
    val userId: String = "",
    val postId: String = "",
    val type: InteractionType = InteractionType.LIKE,
    val createdAt: Date = Date()
)

enum class InteractionType {
    LIKE,
    SAVE
}
