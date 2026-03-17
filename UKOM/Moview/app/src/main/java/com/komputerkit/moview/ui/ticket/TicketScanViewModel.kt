package com.komputerkit.moview.ui.ticket

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.TicketScanRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class TicketScanViewModel : ViewModel() {

    private val _scanSuccessMessage = MutableLiveData<String?>(null)
    val scanSuccessMessage: LiveData<String?> = _scanSuccessMessage

    private val _scanErrorMessage = MutableLiveData<String?>(null)
    val scanErrorMessage: LiveData<String?> = _scanErrorMessage

    fun validateTicket(ticketCode: String) {
        if (ticketCode.isBlank()) {
            _scanErrorMessage.value = "Ticket code tidak valid"
            return
        }

        viewModelScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.movieApiService.scanTicket(TicketScanRequest(ticketCode))
                }

                if (response.success) {
                    _scanSuccessMessage.value = response.message ?: "Ticket Valid - Selamat Menonton"
                } else {
                    _scanErrorMessage.value = response.message ?: "Gagal validasi ticket"
                }
            } catch (e: Exception) {
                _scanErrorMessage.value = e.message ?: "Gagal validasi ticket"
            }
        }
    }
}
