package com.komputerkit.moview.data.model

/** Event card on the Bioskop tab. */
data class EventItem(
    val id: Int,
    val title: String,
    val description: String?,
    val bannerUrl: String?,
    val startDate: String,
    val endDate: String,
    val cinemaName: String?,
    val startPrice: Double?,
    val saleStartsAt: String? = null,
    /** Server-computed (WIB): false while the sale window has not opened yet. */
    val salesOpen: Boolean = true
)

data class EventFilm(
    val title: String,
    val synopsis: String?,
    val posterUrl: String?
)

data class EventSession(
    val id: Int,
    val startsAt: String,
    val sessionTitle: String?,
    val posterUrl: String?,
    val totalDurationMinutes: Int,
    val ageRating: String?,
    val isSurprise: Boolean = false,
    val films: List<EventFilm>,
    val minPrice: Double?,
    val maxPrice: Double?,
    val soldOut: Boolean,
    val status: String = "tersedia"
)

data class EventDetail(
    val id: Int,
    val title: String,
    val description: String?,
    val bannerUrl: String?,
    val startDate: String,
    val endDate: String,
    val cinemaName: String?,
    val saleStartsAt: String?,
    /** Server-computed (WIB): false while the sale window has not opened yet. */
    val salesOpen: Boolean = true,
    val sessions: List<EventSession>
)
