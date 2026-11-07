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
import com.komputerkit.moview.data.api.ValidatePromoRequest
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

data class OrderSummaryUiState(
    val isCreatingPayment: Boolean = false,
    val isSyncingPayment: Boolean = false,
    val isApplyingPromo: Boolean = false,
    val promoCode: String? = null,
    val promoDiscount: Int = 0,
    val promoMessage: String? = null,
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

    fun createPayment(userId: Int, scheduleId: Int, selectedSeats: List<Int>, promoCode: String? = null) {
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
                        selected_seats = selectedSeats,
                        promo_code = promoCode?.trim()?.takeIf { it.isNotBlank() }
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

    /** Discount is priced by the server; the app only displays it. */
    fun applyPromo(userId: Int, scheduleId: Int, selectedSeats: List<Int>, code: String) {
        val normalized = code.trim().uppercase()
        if (normalized.isBlank()) {
            _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(
                promoMessage = "Masukkan kode promo terlebih dahulu."
            )
            return
        }
        if (selectedSeats.isEmpty()) {
            _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(
                promoMessage = "Pilih kursi terlebih dahulu."
            )
            return
        }

        _uiState.value = (_uiState.value ?: OrderSummaryUiState()).copy(
            isApplyingPromo = true,
            promoMessage = null
        )

        viewModelScope.launch {
            try {
                val response = api.validatePromo(
                    ValidatePromoRequest(
                        user_id = userId,
                        schedule_id = scheduleId,
                        selected_seats = selectedSeats,
                        promo_code = normalized
                    )
                )

                val data = response.data
                if (response.success && data != null) {
                    _uiState.postValue(
                        (_uiState.value ?: OrderSummaryUiState()).copy(
                            isApplyingPromo = false,
                            promoCode = data.code,
                            promoDiscount = data.discount_amount,
                            promoMessage = "Kode ${data.code} dipakai: hemat Rp${formatRupiah(data.discount_amount)}"
                        )
                    )
                } else {
                    _uiState.postValue(
                        (_uiState.value ?: OrderSummaryUiState()).copy(
                            isApplyingPromo = false,
                            promoCode = null,
                            promoDiscount = 0,
                            promoMessage = response.message ?: "Kode promo tidak berlaku."
                        )
                    )
                }
            } catch (e: Exception) {
                val errorMessage = when (e) {
                    is HttpException -> {
                        val rawBody = e.response()?.errorBody()?.string()
                        if (!rawBody.isNullOrBlank()) {
                            runCatching { JSONObject(rawBody).optString("message") }
                                .getOrNull().takeUnless { it.isNullOrBlank() } ?: rawBody
                        } else {
                            e.message()
                        }
                    }
                    else -> e.message
                } ?: "Terjadi kesalahan jaringan"

                _uiState.postValue(
                    (_uiState.value ?: OrderSummaryUiState()).copy(
                        isApplyingPromo = false,
                        promoCode = null,
                        promoDiscount = 0,
                        promoMessage = errorMessage
                    )
                )
            }
        }
    }

    fun clearPromo() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(
            promoCode = null,
            promoDiscount = 0,
            promoMessage = null,
            isApplyingPromo = false
        )
    }

    fun clearPromoMessage() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(promoMessage = null)
    }

    private fun formatRupiah(value: Int): String =
        java.text.NumberFormat.getNumberInstance(java.util.Locale("id", "ID")).format(value)

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
