package com.komputerkit.moview.ui.cinema

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.ScheduleDto
import com.komputerkit.moview.ui.cinema.model.CinemaBrand
import com.komputerkit.moview.ui.cinema.model.CinemaSchedule
import com.komputerkit.moview.ui.cinema.model.ShowDate
import com.komputerkit.moview.ui.cinema.model.ShowTime
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

data class MovieScheduleUiState(
    val isLoading: Boolean = false,
    val city: String? = null,
    val availableCities: List<String> = emptyList(),
    val dates: List<ShowDate> = emptyList(),
    val selectedDate: ShowDate? = null,
    val cinemas: List<CinemaSchedule> = emptyList(),
    val filteredCinemas: List<CinemaSchedule> = emptyList(),
    val searchQuery: String = "",
    val error: String? = null
)

class MovieScheduleViewModel(application: Application) : AndroidViewModel(application) {

    private val tag = "MovieScheduleVM"

    private val apiService = RetrofitClient.movieApiService

    private val _uiState = MutableLiveData(MovieScheduleUiState())
    val uiState: LiveData<MovieScheduleUiState> = _uiState

    init {
        val dates = buildDates()
        _uiState.value = _uiState.value?.copy(
            dates = dates,
            selectedDate = dates.firstOrNull()
        )
    }

    fun loadCities() {
        Log.d(tag, "loadCities() start")
        viewModelScope.launch {
            try {
                val response = apiService.getCinemaCities()
                if (response.success && response.data != null) {
                    val cleanCities = response.data.map { it.trim() }.filter { it.isNotBlank() }.distinct()
                    Log.d(tag, "loadCities() success count=${cleanCities.size} cities=$cleanCities")
                    _uiState.postValue(
                        (_uiState.value ?: MovieScheduleUiState()).copy(
                            availableCities = cleanCities
                        )
                    )
                } else {
                    Log.e(tag, "loadCities() failed success=${response.success} message=${response.message}")
                }
            } catch (e: Exception) {
                Log.e(tag, "loadCities() exception: ${e.message}", e)
            }
        }
    }

    fun setCity(city: String) {
        val current = _uiState.value ?: return
        if (current.city == city) return
        Log.d(tag, "setCity() city=$city")
        _uiState.value = current.copy(city = city, error = null)
    }

    fun setDateByIndex(index: Int) {
        val current = _uiState.value ?: return
        val selected = current.dates.getOrNull(index) ?: return
        Log.d(tag, "setDateByIndex() index=$index isoDate=${selected.isoDate}")
        _uiState.value = current.copy(selectedDate = selected, error = null)
        applyFilters()
    }

    fun setSearchQuery(query: String) {
        val current = _uiState.value ?: return
        Log.d(tag, "setSearchQuery() query='${query.trim()}'")
        _uiState.value = current.copy(searchQuery = query)
        applyFilters()
    }

    fun clearError() {
        val current = _uiState.value ?: return
        _uiState.value = current.copy(error = null)
    }

    fun loadSchedules(movieId: Int) {
        val current = _uiState.value ?: return
        Log.d(tag, "loadSchedules() start movieId=$movieId city=${current.city}")
        if (movieId <= 0) {
            Log.e(tag, "loadSchedules() invalid movieId=$movieId")
            _uiState.value = current.copy(error = "Movie ID tidak valid")
            return
        }
        if (current.city.isNullOrBlank()) {
            Log.e(tag, "loadSchedules() skipped because city is empty")
            return
        }

        _uiState.value = current.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val response = apiService.getSchedules(movieId)
                if (response.success && response.data != null) {
                    val currentState = _uiState.value ?: MovieScheduleUiState()
                    val selectedCity = currentState.city.orEmpty().trim()
                    val allSchedules = response.data
                    val allScheduleCities = allSchedules
                        .map { extractCity(it.cinema_location) }
                        .map { it.trim() }
                        .filter { it.isNotBlank() }
                        .distinct()
                        .sorted()
                    Log.d(
                        tag,
                        "loadSchedules() api success movieId=$movieId totalSchedules=${allSchedules.size} selectedCity=$selectedCity citiesInPayload=$allScheduleCities"
                    )

                    if (allSchedules.isEmpty()) {
                        val msg = "Belum ada jadwal tayang untuk film ini"
                        Log.e(tag, "loadSchedules() no schedules at all for movieId=$movieId")
                        _uiState.postValue(
                            currentState.copy(
                                isLoading = false,
                                cinemas = emptyList(),
                                filteredCinemas = emptyList(),
                                error = msg
                            )
                        )
                        return@launch
                    }

                    val schedulesInSelectedCity = allSchedules.filter { schedule ->
                        val scheduleCity = extractCity(schedule.cinema_location)
                        scheduleCity.equals(selectedCity, ignoreCase = true)
                    }

                    if (schedulesInSelectedCity.isEmpty()) {
                        val availableCities = allScheduleCities
                        val availableCitiesText = if (availableCities.isEmpty()) "-" else availableCities.joinToString(", ")
                        val msg = "Jadwal tidak tersedia di $selectedCity. Kota tersedia: $availableCitiesText"
                        Log.e(tag, "loadSchedules() no schedules for selected city. availableCities=$availableCities")
                        _uiState.postValue(
                            currentState.copy(
                                isLoading = false,
                                cinemas = emptyList(),
                                filteredCinemas = emptyList(),
                                error = msg
                            )
                        )
                        return@launch
                    }

                    val grouped = mapSchedulesToCinemas(schedulesInSelectedCity)
                    val availableScheduleDates = schedulesInSelectedCity
                        .map { it.show_date }
                        .distinct()
                        .sorted()
                    val enabledDates = currentState.dates.map { date ->
                        date.copy(isEnabled = availableScheduleDates.contains(date.isoDate))
                    }
                    val effectiveSelectedDate = when {
                        currentState.selectedDate?.isoDate in availableScheduleDates -> currentState.selectedDate
                        else -> enabledDates.firstOrNull { it.isoDate in availableScheduleDates }
                            ?: currentState.selectedDate
                    }
                    val dateFiltered = filterByDate(grouped, effectiveSelectedDate?.isoDate)
                    Log.d(
                        tag,
                        "loadSchedules() mapped cinemas=${grouped.size} date=${effectiveSelectedDate?.isoDate} dateFiltered=${dateFiltered.size}"
                    )
                    _uiState.postValue(
                        currentState.copy(
                            isLoading = false,
                            dates = enabledDates,
                            cinemas = grouped,
                            selectedDate = effectiveSelectedDate,
                            filteredCinemas = applySearchFilter(dateFiltered, _uiState.value?.searchQuery.orEmpty()),
                            error = null
                        )
                    )
                } else {
                    Log.e(tag, "loadSchedules() failed success=${response.success} message=${response.message}")
                    _uiState.postValue(
                        (_uiState.value ?: MovieScheduleUiState()).copy(
                            isLoading = false,
                            cinemas = emptyList(),
                            filteredCinemas = emptyList(),
                            error = response.message ?: "Gagal memuat jadwal"
                        )
                    )
                }
            } catch (e: Exception) {
                Log.e(tag, "loadSchedules() exception: ${e.message}", e)
                _uiState.postValue(
                    (_uiState.value ?: MovieScheduleUiState()).copy(
                        isLoading = false,
                        cinemas = emptyList(),
                        filteredCinemas = emptyList(),
                        error = e.message ?: "Terjadi kesalahan jaringan"
                    )
                )
            }
        }
    }

    private fun applyFilters() {
        val current = _uiState.value ?: return
        val dateFiltered = filterByDate(current.cinemas, current.selectedDate?.isoDate)
        Log.d(
            tag,
            "applyFilters() cinemas=${current.cinemas.size} date=${current.selectedDate?.isoDate} dateFiltered=${dateFiltered.size} query='${current.searchQuery.trim()}'"
        )
        _uiState.value = current.copy(filteredCinemas = applySearchFilter(dateFiltered, current.searchQuery))
    }

    private fun applySearchFilter(items: List<CinemaSchedule>, query: String): List<CinemaSchedule> {
        val normalized = query.trim().lowercase()
        if (normalized.isBlank()) return items
        return items.filter { it.cinemaName.lowercase().contains(normalized) }
    }

    private fun filterByDate(items: List<CinemaSchedule>, isoDate: String?): List<CinemaSchedule> {
        if (isoDate.isNullOrBlank()) return items
        return items.mapNotNull { cinema ->
            val timesForDate = cinema.showTimes.filter { it.time.startsWith("$isoDate ") }
                .map { it.copy(time = it.time.removePrefix("$isoDate ")) }
            if (timesForDate.isEmpty()) null else cinema.copy(showTimes = timesForDate)
        }
    }

    private fun mapSchedulesToCinemas(schedules: List<ScheduleDto>): List<CinemaSchedule> {
        return schedules
            .groupBy { it.cinema_name }
            .map { (cinemaName, rows) ->
                val sortedRows = rows.sortedWith(compareBy({ it.show_date }, { it.show_time }))
                val first = sortedRows.first()

                CinemaSchedule(
                    cinemaId = cinemaName,
                    cinemaName = cinemaName,
                    serviceName = first.service_name?.trim().orEmpty(),
                    studioType = first.studio_type?.takeIf { it.isNotBlank() } ?: first.studio_name,
                    priceRange = formatRupiah(first.ticket_price.toInt()),
                    brand = detectBrand(cinemaName),
                    showTimes = sortedRows.map {
                        ShowTime(
                            time = "${it.show_date} ${formatShowTime(it.show_time)}",
                            scheduleId = it.schedule_id,
                            isAvailable = isScheduleAvailable(it)
                        )
                    }
                )
            }
            .sortedBy { it.cinemaName }
    }

    private fun formatShowTime(rawTime: String): String {
        val normalized = rawTime.trim()
        return when {
            normalized.matches(Regex("^\\d{2}:\\d{2}:\\d{2}$")) -> normalized.substring(0, 5)
            normalized.matches(Regex("^\\d{2}:\\d{2}$")) -> normalized
            else -> normalized
        }
    }

    private fun isScheduleAvailable(schedule: ScheduleDto): Boolean {
        val status = schedule.status.orEmpty().trim().lowercase()
        return status != "expired" && status != "cancelled"
    }

    private fun extractCity(cinemaLocation: String): String {
        val city = cinemaLocation.substringBefore(',').trim()
        return city.ifBlank { cinemaLocation.trim() }
    }

    private fun detectBrand(cinemaName: String): CinemaBrand {
        val upper = cinemaName.uppercase()
        return when {
            upper.contains("XXI") -> CinemaBrand.XXI
            upper.contains("CGV") -> CinemaBrand.CGV
            upper.contains("CINEPOLIS") -> CinemaBrand.CINEPOLIS
            else -> CinemaBrand.OTHER
        }
    }

    private fun formatPriceRange(min: Int, max: Int): String {
        val minFormatted = formatRupiah(min)
        val maxFormatted = formatRupiah(max)
        return if (min == max) minFormatted else "$minFormatted - $maxFormatted"
    }

    private fun formatRupiah(value: Int): String {
        val digits = value.toString().reversed().chunked(3).joinToString(".").reversed()
        return "Rp$digits"
    }

    private fun buildDates(): List<ShowDate> {
        val calendar = Calendar.getInstance()
        val monthNames = listOf("Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des")
        val dayNames = listOf("MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB")
        val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

        return (0..6).map { i ->
            if (i > 0) {
                calendar.add(Calendar.DAY_OF_YEAR, 1)
            }
            ShowDate(
                day = calendar.get(Calendar.DAY_OF_MONTH),
                month = monthNames[calendar.get(Calendar.MONTH)],
                label = if (i == 0) "Hari ini" else dayNames[calendar.get(Calendar.DAY_OF_WEEK) - 1],
                isoDate = isoFormat.format(calendar.time)
            )
        }
    }
}
