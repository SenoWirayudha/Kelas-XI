package com.komputerkit.blogapp.data

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName
import java.util.Date

data class User(
    @DocumentId
    val id: String = "",
    @PropertyName("email")
    val email: String = "",
    @PropertyName("displayName") 
    val displayName: String = "",
    @PropertyName("profileImageUrl")
    val profileImageUrl: String = "",
    @PropertyName("profileImageBase64")
    val profileImageBase64: String = "",
    @PropertyName("createdAt")
    val createdAt: Date = Date()
) {
    // No-argument constructor for Firestore
    constructor() : this("", "", "", "", "", Date())
}
