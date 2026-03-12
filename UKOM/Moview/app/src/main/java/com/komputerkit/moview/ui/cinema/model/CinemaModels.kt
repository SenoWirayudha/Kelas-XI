package com.komputerkit.moview.ui.cinema.model

import java.io.Serializable

// ── Movie Schedule Screen ──────────────────────────────────────────────────

data class ShowDate(
    val day: Int,
    val month: String,
    val label: String,          // "Hari ini", "SEL", "RAB", …
    val isSelected: Boolean = false
)

data class ShowTime(
    val time: String,           // "13:20"
    val isAvailable: Boolean = true
)

data class CinemaSchedule(
    val cinemaId: String,
    val cinemaName: String,
    val studioType: String,     // "REGULAR 2D"
    val priceRange: String,     // "Rp35.000 – Rp40.000"
    val brand: CinemaBrand,
    val isFavorite: Boolean = false,
    val showTimes: List<ShowTime>
) : Serializable

enum class CinemaBrand { XXI, CGV, CINEPOLIS, OTHER }

// ── Seat Selection Screen ──────────────────────────────────────────────────

enum class SeatStatus { AVAILABLE, BOOKED, SELECTED }

data class Seat(
    val row: String,            // "A"
    val number: Int,            // 4
    val status: SeatStatus = SeatStatus.AVAILABLE
) : Serializable {
    val id: String get() = "$row$number"
}

// ── Order Summary Screen ───────────────────────────────────────────────────

data class PaymentMethod(
    val id: String,
    val name: String,
    val description: String,
    val logoResId: Int,
    val promoLabel: String? = null
) : Serializable

// ── Shared booking intent data ─────────────────────────────────────────────

data class BookingData(
    val movieTitle: String,
    val moviePosterUrl: String,
    val movieRating: Double,
    val movieAgeRating: String,
    val cinemaName: String,
    val studioName: String,
    val studioType: String,
    val showDate: String,
    val showTime: String,
    val ticketPrice: Int,
    val serviceCharge: Int = 4000
) : Serializable
