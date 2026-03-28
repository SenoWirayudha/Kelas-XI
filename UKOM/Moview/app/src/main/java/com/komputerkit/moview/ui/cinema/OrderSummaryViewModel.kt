package com.komputerkit.moview.ui.cinema

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.CreatePaymentRequest
import com.komputerkit.moview.data.api.CreatePaymentResponseDto
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.SyncPaymentStatusRequest
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

data class OrderSummaryUiState(
    val isCreatingPayment: Boolean = false,
    val isSyncingPayment: Boolean = false,
    val error: String? = null,
    val paymentResult: CreatePaymentResponseDto? = null,
    val syncMessage: String? = null,
    val paymentCompleted: Boolean = false,
    val syncedOrderStatus: String? = null
)

class OrderSummaryViewModel(application: Application) : AndroidViewModel(application) {

    private val api = RetrofitClient.movieApiService

    private val _uiState = MutableLiveData(OrderSummaryUiState())
    val uiState: LiveData<OrderSummaryUiState> = _uiState

    fun createPayment(userId: Int, scheduleId: Int, selectedSeats: List<Int>) {
        if (userId <= 0) {
            _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(error = "User tidak valid")
            return
        }
        if (scheduleId <= 0) {
            _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(error = "Schedule tidak valid")
            return
        }
        if (selectedSeats.isEmpty()) {
            _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(error = "Kursi belum dipilih")
            return
        }

        _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(
            isCreatingPayment = true,
            error = null
        )

        viewModelScope.launch {
            try {
                val response = api.createPayment(
                    CreatePaymentRequest(
                        user_id = userId,
                        schedule_id = scheduleId,
                        selected_seats = selectedSeats
                    )
                )

                if (response.success && response.data != null) {
                    _uiState.postValue(
                        (_uiState.value ?: OrderSummaryUiState()).copy(
                            isCreatingPayment = false,
                            error = null,
                            paymentResult = response.data
                        )
                    )
                } else {
                    _uiState.postValue(
                        (_uiState.value ?: OrderSummaryUiState()).copy(
                            isCreatingPayment = false,
                            error = response.message ?: "Gagal membuat pembayaran"
                        )
                    )
                }
            } catch (e: Exception) {
                val errorMessage = when (e) {
                    is HttpException -> {
                        val rawBody = e.response()?.errorBody()?.string()
                        if (!rawBody.isNullOrBlank()) {
                            runCatching {
                                JSONObject(rawBody).optString("message")
                            }.getOrNull().takeUnless { it.isNullOrBlank() }
                                ?: rawBody
                        } else {
                            e.message()
                        }
                    }
                    else -> e.message
                } ?: "Terjadi kesalahan jaringan"

                _uiState.postValue(
                    (_uiState.value ?: OrderSummaryUiState()).copy(
                        isCreatingPayment = false,
                        error = errorMessage
                    )
                )
            }
        }
    }

    fun clearPaymentResult() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(paymentResult = null)
    }

    fun syncPaymentStatus(orderCode: String) {
        if (orderCode.isBlank()) {
            _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(error = "Order code tidak valid")
            return
        }

        _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(
            isSyncingPayment = true,
            error = null
        )

        viewModelScope.launch {
            val maxAttempts = 30
            val retryDelayMs = 2000L
            var lastError: String? = null

            repeat(maxAttempts) { index ->
                val attempt = index + 1
                try {
                    val response = api.syncPaymentStatus(SyncPaymentStatusRequest(order_code = orderCode))
                    if (response.success && response.data != null) {
                        val orderStatus = response.data.order_status.lowercase()
                        val transactionStatus = response.data.transaction_status?.lowercase()

                        if (orderStatus == "paid") {
                            _uiState.postValue(
                                (_uiState.value ?: OrderSummaryUiState()).copy(
                                    isSyncingPayment = false,
                                    error = null,
                                    syncMessage = "Pembayaran berhasil dikonfirmasi",
                                    paymentCompleted = true,
                                    syncedOrderStatus = orderStatus
                                )
                            )
                            return@launch
                        }

                        lastError = "Status pembayaran masih ${transactionStatus ?: orderStatus}"
                    } else {
                        lastError = response.message ?: "Gagal sinkronisasi status pembayaran"
                    }
                } catch (e: Exception) {
                    lastError = when (e) {
                        is HttpException -> {
                            val rawBody = e.response()?.errorBody()?.string()
                            if (!rawBody.isNullOrBlank()) {
                                runCatching {
                                    JSONObject(rawBody).optString("message")
                                }.getOrNull().takeUnless { it.isNullOrBlank() }
                                    ?: rawBody
                            } else {
                                e.message()
                            }
                        }
                        else -> e.message
                    } ?: "Terjadi kesalahan jaringan"
                }

                if (attempt < maxAttempts) {
                    delay(retryDelayMs)
                }
            }

            _uiState.postValue(
                (_uiState.value ?: OrderSummaryUiState()).copy(
                    isSyncingPayment = false,
                    error = null,
                    syncMessage = lastError ?: "Status pembayaran masih pending, cek lagi beberapa saat.",
                    paymentCompleted = false,
                    syncedOrderStatus = "pending"
                )
            )
        }
    }

    fun clearSyncMessage() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(syncMessage = null)
    }

    fun clearPaymentCompleted() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(paymentCompleted = false)
    }

    fun clearSyncedOrderStatus() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(syncedOrderStatus = null)
    }

    fun clearError() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(error = null)
    }

}
