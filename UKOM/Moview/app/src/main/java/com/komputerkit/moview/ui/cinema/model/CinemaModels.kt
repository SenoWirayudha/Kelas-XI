package com.komputerkit.moview.ui.cinema.model

import java.io.Serializable

// ── Movie Schedule Screen ──────────────────────────────────────────────────

data class ShowDate(
    val day: Int,
    val month: String,
    val label: String,          // "Hari ini", "SEL", "RAB", …
    val isoDate: String,
    val isEnabled: Boolean = true,
    val isSelected: Boolean = false
)

data class ShowTime(
    val time: String,           // "13:20"
    val scheduleId: Int = 0,
    val isAvailable: Boolean = true
)

data class CinemaSchedule(
    val cinemaId: String,
    val cinemaName: String,
    val serviceName: String = "",
    val studioType: String,     // "REGULAR 2D"
    val priceRange: String,     // "Rp35.000 – Rp40.000"
    val brand: CinemaBrand,
    val isFavorite: Boolean = false,
    val showTimes: List<ShowTime>
) : Serializable

enum class CinemaBrand { XXI, CGV, CINEPOLIS, OTHER }

// ── Seat Selection Screen ──────────────────────────────────────────────────

enum class SeatStatus { AVAILABLE, BOOKED, SELECTED, UNAVAILABLE }

/**
 * Dynamic seat type definition (from API seat_type_definitions).
 * Color is a hex string like "#F472B6" coming from the backend.
 */
data class SeatType(
    val key: String,
    val label: String = "",
    val color: String = "#64748B",
    val priceMultiplier: Double = 1.0,
    val purchaseMode: String? = null
) : Serializable {
    /** Sellable seats are anything that is not a layout placeholder. */
    val isSellable: Boolean get() = purchaseMode == "individual" || purchaseMode == "paired"

    /** Paired types must be bought/picked together as a whole group. */
    val isPaired: Boolean get() = purchaseMode == "paired"

    companion object {
        val DEFAULT = SeatType(key = "seat", label = "Regular", color = "#64748B", priceMultiplier = 1.0, purchaseMode = "individual")
        val AISLE = SeatType(key = "aisle", label = "Aisle", color = "#CBD5E1", purchaseMode = null)
        val ENTRANCE = SeatType(key = "entrance", label = "Entrance", color = "#94A3B8", purchaseMode = null)
        val UNAVAILABLE = SeatType(key = "unavailable", label = "Unavailable", color = "#1E293B", purchaseMode = null)

        fun placeholder(key: String?): SeatType? = when (key) {
            "aisle" -> AISLE
            "entrance" -> ENTRANCE
            "unavailable" -> UNAVAILABLE
            else -> null
        }
    }
}

data class Seat(
    val seatId: Int? = null,
    val row: String,            // "A"
    val number: Int,            // 4
    val seatCode: String? = null,
    val positionX: Int = 0,
    val positionY: Int = 0,
    val type: SeatType = SeatType.DEFAULT,
    val status: SeatStatus = SeatStatus.AVAILABLE,
    val price: Int = 0,
    val seatGroup: String? = null
) : Serializable {
    val id: String get() = seatCode ?: if (row.isNotBlank() && number > 0) "$row$number" else ""
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
    val scheduleId: Int = 0,
    val movieTitle: String,
    val moviePosterUrl: String,
    val movieRating: Double,
    val movieAgeRating: String,
    val serviceName: String = "",
    val cinemaName: String,
    val studioName: String,
    val studioType: String,
    val showDate: String,
    val showTime: String,
    val selectedSeatIds: List<Int> = emptyList(),
    val ticketPrice: Int,
    val serviceCharge: Int = 4000
) : Serializable
