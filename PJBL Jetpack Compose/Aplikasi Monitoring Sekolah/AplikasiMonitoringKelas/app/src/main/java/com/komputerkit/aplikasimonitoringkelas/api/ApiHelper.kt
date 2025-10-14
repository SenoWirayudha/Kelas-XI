package com.komputerkit.aplikasimonitoringkelas.api

import android.util.Log
import com.google.gson.Gson
import com.komputerkit.aplikasimonitoringkelas.api.models.ErrorResponse
import retrofit2.Response

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val message: String, val errors: Map<String, List<String>>? = null) : ApiResult<Nothing>()
    object Loading : ApiResult<Nothing>()
}

object ApiHelper {
    
    private const val TAG = "ApiHelper"
    
    suspend fun <T> safeApiCall(
        apiCall: suspend () -> Response<T>
    ): ApiResult<T> {
        return try {
            val response = apiCall()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    ApiResult.Success(body)
                } else {
                    ApiResult.Error("Response body is null")
                }
            } else {
                val errorBody = response.errorBody()?.string()
                Log.e(TAG, "API Error: $errorBody")
                
                try {
                    val errorResponse = Gson().fromJson(errorBody, ErrorResponse::class.java)
                    ApiResult.Error(
                        message = errorResponse.message,
                        errors = errorResponse.errors
                    )
                } catch (e: Exception) {
                    ApiResult.Error("Error: ${response.code()} ${response.message()}")
                }
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Timeout Exception", e)
            ApiResult.Error("Koneksi timeout. Pastikan server Laravel berjalan di http://127.0.0.1:8000")
        } catch (e: java.net.ConnectException) {
            Log.e(TAG, "Connection Exception", e)
            ApiResult.Error("Tidak dapat terhubung ke server. Pastikan:\n1. Server Laravel running (php artisan serve)\n2. URL: http://10.0.2.2:8000 untuk emulator")
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Unknown Host Exception", e)
            ApiResult.Error("Host tidak ditemukan. Cek konfigurasi BASE_URL di ApiConfig.kt")
        } catch (e: Exception) {
            Log.e(TAG, "API Exception", e)
            ApiResult.Error(e.message ?: "Unknown error occurred")
        }
    }
}
