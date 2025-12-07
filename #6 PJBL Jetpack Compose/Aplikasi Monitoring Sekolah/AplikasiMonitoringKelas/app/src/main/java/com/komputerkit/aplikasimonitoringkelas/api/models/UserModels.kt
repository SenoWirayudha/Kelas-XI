package com.komputerkit.aplikasimonitoringkelas.api.models

// Request untuk create user
data class CreateUserRequest(
    val name: String,
    val email: String,
    val password: String,
    val password_confirmation: String,
    val role: String  // siswa, kurikulum, kepala_sekolah, admin
)

// Request untuk update user
data class UpdateUserRequest(
    val name: String,
    val email: String,
    val password: String?,  // Optional, null jika tidak diubah
    val password_confirmation: String?,
    val role: String
)

// Response untuk single user
data class UserResponse(
    val success: Boolean,
    val message: String,
    val data: UserData
)

// Response untuk list user
data class UserListResponse(
    val success: Boolean,
    val message: String?,
    val data: List<UserData>
)

// Data user yang diterima dari API
data class UserData(
    val id: Int,
    val name: String,
    val email: String,
    val role: String,
    val email_verified_at: String?,
    val created_at: String,
    val updated_at: String
)
