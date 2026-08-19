package com.komputerkit.moview.ui.cinema

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.SeatLayoutSeatDto
import com.komputerkit.moview.data.api.SeatTypeDefinitionDto
import com.komputerkit.moview.ui.cinema.model.Seat
import com.komputerkit.moview.ui.cinema.model.SeatStatus
import com.komputerkit.moview.ui.cinema.model.SeatType
import kotlinx.coroutines.launch

data class SeatSelectionUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val rows: Int = 1,
    val columns: Int = 1,
    val rowDirection: String = "front_to_back",
    val seatTypes: List<SeatType> = emptyList(),
    val seats: List<Seat> = emptyList()
)

class SeatSelectionViewModel(application: Application) : AndroidViewModel(application) {

    private val api = RetrofitClient.movieApiService
    private val logTag = "SeatSelectionVM"

    private val _uiState = MutableLiveData(SeatSelectionUiState())
    val uiState: LiveData<SeatSelectionUiState> = _uiState

    fun loadSeatLayout(scheduleId: Int) {
        if (scheduleId <= 0) {
            _uiState.value = _uiState.value?.copy(error = "Schedule ID tidak valid")
            return
        }

        _uiState.value = (_uiState.value ?: SeatSelectionUiState()).copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val response = api.getSeatLayout(scheduleId)
                if (response.success && response.data != null) {
                    val dto = response.data
                    val seatTypes = (dto.seat_type_definitions ?: emptyList()).map { it.toSeatType() }
                    val mapped = buildGrid(dto.rows, dto.columns, dto.seats, seatTypes)
                    val normalizedRows = mapped.maxOfOrNull { it.positionY } ?: 0
                    val normalizedColumns = mapped.maxOfOrNull { it.positionX } ?: 0
                    _uiState.postValue(
                        SeatSelectionUiState(
                            isLoading = false,
                            rows = normalizedRows.coerceAtLeast(1),
                            columns = normalizedColumns.coerceAtLeast(1),
                            rowDirection = dto.row_direction ?: "front_to_back",
                            seatTypes = seatTypes,
                            seats = mapped,
                            error = null
                        )
                    )
                    Log.d(logTag, "loadSeatLayout success scheduleId=$scheduleId rows=${dto.rows} columns=${dto.columns} seats=${mapped.size} types=${seatTypes.size}")
                } else {
                    _uiState.postValue(
                        (_uiState.value ?: SeatSelectionUiState()).copy(
                            isLoading = false,
                            error = response.message ?: "Gagal memuat seat layout"
                        )
                    )
                }
            } catch (e: Exception) {
                Log.e(logTag, "loadSeatLayout exception: ${e.message}", e)
                _uiState.postValue(
                    (_uiState.value ?: SeatSelectionUiState()).copy(
                        isLoading = false,
                        error = e.message ?: "Terjadi kesalahan jaringan"
                    )
                )
            }
        }
    }

    private fun SeatTypeDefinitionDto.toSeatType(): SeatType {
        val multiplier = price_multiplier ?: 1.0
        return SeatType(
            key = key,
            label = label ?: key,
            color = color ?: "#64748B",
            priceMultiplier = multiplier,
            purchaseMode = purchase_mode
        )
    }

    private fun buildGrid(rows: Int, columns: Int, seats: List<SeatLayoutSeatDto>, seatTypes: List<SeatType>): List<Seat> {
        val typeByKey = seatTypes.associateBy { it.key }
        val minRowIndex = seats.minOfOrNull { it.row_index } ?: 0
        val minColumnIndex = seats.minOfOrNull { it.column } ?: 0

        val normalizedSeats = seats.map { dto ->
            val normalizedRow = (dto.row_index - minRowIndex)
            val normalizedColumn = (dto.column - minColumnIndex)
            Triple(normalizedRow, normalizedColumn, dto)
        }

        val maxNormalizedRow = normalizedSeats.maxOfOrNull { it.first } ?: 0
        val maxNormalizedColumn = normalizedSeats.maxOfOrNull { it.second } ?: 0

        val rowCount = maxOf(rows, maxNormalizedRow + 1).coerceAtLeast(1)
        val columnCount = maxOf(columns, maxNormalizedColumn + 1).coerceAtLeast(1)

        val seatByPosition = normalizedSeats.associateBy { Pair(it.first, it.second) }
        val result = mutableListOf<Seat>()

        // Matrix-based rendering: iterate rows first, then columns.
        for (rowIndex in 0 until rowCount) {
            for (columnIndex in 0 until columnCount) {
                val dto = seatByPosition[Pair(rowIndex, columnIndex)]?.third
                if (dto == null) {
                    result.add(
                        Seat(
                            row = "",
                            number = 0,
                            positionX = columnIndex + 1,
                            positionY = rowIndex + 1,
                            type = SeatType.AISLE,
                            status = SeatStatus.AVAILABLE
                        )
                    )
                    continue
                }

                val rawType = dto.seat_type.lowercase()
                val seatType = typeByKey[rawType]
                    ?: SeatType.placeholder(rawType)
                    ?: SeatType.DEFAULT

                val isInactive = dto.is_active == false || !seatType.isSellable
                val status = when {
                    isInactive -> SeatStatus.UNAVAILABLE
                    dto.status?.lowercase() == "booked" -> SeatStatus.BOOKED
                    else -> SeatStatus.AVAILABLE
                }

                val number = dto.seat_code
                    ?.replace(Regex("[^0-9]"), "")
                    ?.toIntOrNull()
                    ?: 0

                result.add(
                    Seat(
                        seatId = dto.seat_id,
                        row = dto.row.orEmpty(),
                        number = if (number > 0) number else columnIndex + 1,
                        seatCode = dto.seat_code ?: if (seatType.key == "seat") {
                            val rowLabel = dto.row?.takeIf { it.isNotBlank() }
                                ?: (("A".first().code + rowIndex).toChar().toString())
                            "$rowLabel${columnIndex + 1}"
                        } else null,
                        positionX = columnIndex + 1,
                        positionY = rowIndex + 1,
                        type = seatType,
                        status = status,
                        price = dto.price?.toInt() ?: 0,
                        seatGroup = dto.seat_group
                    )
                )
            }
        }

        return result
    }
}
