package com.komputerkit.moview.ui.ticket

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.UserTicketHistoryDto
import com.komputerkit.moview.util.ServerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class TicketHistoryViewModel : ViewModel() {

    private val _activeTickets = MutableLiveData<List<TicketHistoryItem>>(emptyList())
    val activeTickets: LiveData<List<TicketHistoryItem>> = _activeTickets

    private val _historyTickets = MutableLiveData<List<TicketHistoryItem>>(emptyList())
    val historyTickets: LiveData<List<TicketHistoryItem>> = _historyTickets

    private val _errorMessage = MutableLiveData<String?>(null)
    val errorMessage: LiveData<String?> = _errorMessage

    fun loadTickets(userId: Int) {
        viewModelScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.movieApiService.getUserTickets(userId)
                }

                if (!response.success) {
                    _errorMessage.value = response.message ?: "Gagal memuat tiket."
                    _activeTickets.value = emptyList()
                    _historyTickets.value = emptyList()
                    return@launch
                }

                val nowMillis = System.currentTimeMillis()
                val allItems = response.data.orEmpty().map { dto -> dto.toUiItem() }

                _activeTickets.value = allItems.filter { item ->
                    item.orderStatus.equals("paid", ignoreCase = true) &&
                        !item.isScanned &&
                        nowMillis < item.showEndTimeMillis
                }

                _historyTickets.value = allItems.filter { item ->
                    item.isScanned || nowMillis > item.showEndTimeMillis
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "Terjadi kesalahan saat memuat tiket."
                _activeTickets.value = emptyList()
                _historyTickets.value = emptyList()
            }
        }
    }

    private fun UserTicketHistoryDto.toUiItem(): TicketHistoryItem {
        val seats = seats.mapNotNull { it.seat_code }.filter { it.isNotBlank() }
        val studioType = studio.type?.takeIf { it.isNotBlank() }
        val studioInfo = if (studioType != null) {
            "${studio.name} • $studioType"
        } else {
            studio.name
        }

        val parsedDate = formatDate(schedule.show_date)
        val parsedTime = formatTime(schedule.show_time)
        val showEndTimeMillis = computeShowEndTimeMillis(schedule.show_date, schedule.show_time)

        return TicketHistoryItem(
            orderId = order_id,
            movieId = movie.id,
            ticketCode = ticket_code.orEmpty(),
            orderStatus = order_status,
            totalPrice = total_price ?: 0.0,
            paymentMethod = payment_method?.takeIf { it.isNotBlank() } ?: "-",
            isScanned = is_scanned,
            posterUrl = ServerConfig.resolveStorageUrl(movie.poster_path),
            title = movie.title,
            cinemaName = cinema.name,
            studioInfo = studioInfo,
            showDate = parsedDate,
            showTime = parsedTime,
            showEndTimeMillis = showEndTimeMillis,
            seatInfo = if (seats.isEmpty()) "Seat: -" else "Seat: ${seats.joinToString(", ")}",
            status = when {
                is_scanned -> TicketStatus.USED
                System.currentTimeMillis() > showEndTimeMillis -> TicketStatus.EXPIRED
                else -> TicketStatus.ACTIVE
            }
        )
    }

    private fun formatDate(rawDate: String?): String {
        if (rawDate.isNullOrBlank()) return "-"
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val formatter = SimpleDateFormat("dd MMM yyyy", Locale.forLanguageTag("id-ID"))
            val date = parser.parse(rawDate)
            if (date != null) formatter.format(date) else rawDate
        } catch (_: Exception) {
            rawDate
        }
    }

    private fun formatTime(rawTime: String?): String {
        if (rawTime.isNullOrBlank()) return "-"
        return if (rawTime.length >= 5) rawTime.substring(0, 5) else rawTime
    }

    private fun computeShowEndTimeMillis(showDate: String?, showTime: String?): Long {
        if (showDate.isNullOrBlank() || showTime.isNullOrBlank()) {
            return 0L
        }

        val combined = "$showDate ${normalizeTime(showTime)}"
        val patterns = listOf(
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm"
        )

        for (pattern in patterns) {
            try {
                val parser = SimpleDateFormat(pattern, Locale.US)
                parser.isLenient = false
                val date = parser.parse(combined) ?: continue
                val calendar = Calendar.getInstance().apply {
                    time = date
                    add(Calendar.HOUR_OF_DAY, 1)
                }
                return calendar.timeInMillis
            } catch (_: Exception) {
            }
        }

        return 0L
    }

    private fun normalizeTime(rawTime: String): String {
        val trimmed = rawTime.trim()
        return if (trimmed.length == 5) "$trimmed:00" else trimmed
    }
}
