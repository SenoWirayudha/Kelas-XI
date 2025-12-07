package com.komputerkit.aplikasimonitoringkelas.api.models

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val password_confirmation: String,
    val role: String? = null  // siswa, kurikulum, kepala_sekolah, admin
)

// Response wrapper dari Laravel
data class LoginResponse(
    val success: Boolean,
    val message: String,
    val data: LoginData
)

data class LoginData(
    val user: User,
    val token: String
)

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val role: String,  // siswa, kurikulum, kepala_sekolah, admin
    val kelas_id: Int?,  // Foreign key ke tabel kelas (untuk role siswa)
    val kelas: KelasData?,  // Relasi ke kelas (untuk role siswa)
    val email_verified_at: String?,
    val created_at: String,
    val updated_at: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T?
)

data class ErrorResponse(
    val message: String,
    val errors: Map<String, List<String>>?
)
