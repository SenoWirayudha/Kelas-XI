package com.komputerkit.moview.data.repository

import com.komputerkit.moview.data.api.AuthHeroCreditsDto
import com.komputerkit.moview.data.api.ChangePasswordOtpRequest
import com.komputerkit.moview.data.api.ChangePasswordRequest
import com.komputerkit.moview.data.api.DeleteAccountOtpRequest
import com.komputerkit.moview.data.api.DeleteAccountRequest
import com.komputerkit.moview.data.api.ForgotPasswordRequest
import com.komputerkit.moview.data.api.GoogleLoginRequest
import com.komputerkit.moview.data.api.LoginRequest
import com.komputerkit.moview.data.api.RegisterRequest
import com.komputerkit.moview.data.api.ResendOtpRequest
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.VerifyOtpRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    
    private val apiService = RetrofitClient.movieApiService
    
    /**
     * Register step 1: asks the backend to email a 6-digit OTP. Success only
     * means "OTP sent" — the account is created after verifyOtp() succeeds.
     */
    suspend fun register(username: String, email: String, password: String): Result<RegisterOtpData> = withContext(Dispatchers.IO) {
        try {
            val request = RegisterRequest(username, email, password)
            val response = apiService.register(request)
            
            if (response.success && response.data != null) {
                Result.success(RegisterOtpData(response.data.email))
            } else {
                Result.failure(Exception(response.message ?: "Registration failed"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Register step 2: verify the 6-digit OTP; on success the account is
     *  created and a full session (token) is returned. */
    suspend fun verifyOtp(email: String, code: String): Result<LoginData> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.verifyOtp(VerifyOtpRequest(email, code))
            
            if (response.success && response.data != null) {
                val loginData = LoginData(
                    userId = response.data.user.id,
                    username = response.data.user.username,
                    email = response.data.user.email,
                    role = response.data.user.role,
                    token = response.data.token,
                    joinedAt = response.data.user.joined_at
                )
                Result.success(loginData)
            } else {
                Result.failure(Exception(response.message ?: "Verifikasi gagal"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Requests a fresh OTP for a pending registration (60s server cooldown). */
    suspend fun resendOtp(email: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.resendOtp(ResendOtpRequest(email))
            if (response.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message ?: "Gagal mengirim ulang kode"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    suspend fun login(identifier: String, password: String): Result<LoginData> = withContext(Dispatchers.IO) {
        try {
            val request = LoginRequest(identifier, password)
            val response = apiService.login(request)
            
            if (response.success && response.data != null) {
                val loginData = LoginData(
                    userId = response.data.user.id,
                    username = response.data.user.username,
                    email = response.data.user.email,
                    role = response.data.user.role,
                    token = response.data.token,
                    joinedAt = response.data.user.joined_at
                )
                Result.success(loginData)
            } else {
                Result.failure(Exception(response.message ?: "Login failed"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    suspend fun logout(): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.logout()
            response.success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Requests a password reset link. The backend always answers generically,
     * so success here only means "request accepted" — never "email exists".
     */
    suspend fun forgotPassword(email: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.forgotPassword(ForgotPasswordRequest(email))
            if (response.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message ?: "Gagal mengirim link reset"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Change password step 1 (also used as resend): emails a 6-digit OTP for
     *  the account. The server may reject Google-only accounts here. */
    suspend fun requestChangePasswordOtp(email: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.requestChangePasswordOtp(ChangePasswordOtpRequest(email))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message ?: "Gagal mengirim kode OTP"))
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Change password step 2: the new password AND the OTP travel together.
     *  The server verifies the purpose-bound, attempt-limited code before
     *  replacing the password (client-side checks alone are never trusted). */
    suspend fun changePassword(email: String, code: String, password: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.changePassword(ChangePasswordRequest(email, code, password))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message ?: "Gagal mengubah password"))
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Delete-account step 1 (also used as resend): emails a 6-digit OTP. */
    suspend fun requestDeleteAccountOtp(email: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.requestDeleteAccountOtp(DeleteAccountOtpRequest(email))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message ?: "Gagal mengirim kode OTP"))
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Delete-account final call: the server verifies the proof (OTP code for
     *  email/password accounts, or a fresh google_id from a re-login for
     *  Google accounts) before removing user data + the auth account. */
    suspend fun deleteAccount(
        email: String,
        code: String? = null,
        googleId: String? = null
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteAccount(
                DeleteAccountRequest(email = email, code = code, google_id = googleId)
            )
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message ?: "Gagal menghapus akun"))
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /** Title + year for the static auth hero images (login/register/forgot). */
    suspend fun authHeroCredits(): Result<AuthHeroCreditsDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAuthHeroCredits()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to load hero credits"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    suspend fun googleLogin(email: String, displayName: String, googleId: String): Result<LoginData> = withContext(Dispatchers.IO) {
        try {
            val request = GoogleLoginRequest(email, displayName, googleId)
            val response = apiService.googleLogin(request)
            
            if (response.success && response.data != null) {
                val loginData = LoginData(
                    userId = response.data.user.id,
                    username = response.data.user.username,
                    email = response.data.user.email,
                    role = response.data.user.role,
                    token = response.data.token,
                    joinedAt = response.data.user.joined_at
                )
                Result.success(loginData)
            } else {
                Result.failure(Exception(response.message ?: "Google login failed"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}

data class LoginData(
    val userId: Int,
    val username: String,
    val email: String,
    val role: String,
    val token: String,
    val joinedAt: String
)

data class RegisterOtpData(
    val email: String
)
