package com.komputerkit.moview.util

import com.komputerkit.moview.data.api.AvailabilityEntryDto
import com.komputerkit.moview.data.api.CountryAvailabilityDto
import com.komputerkit.moview.data.api.StreamingServiceDto
import java.util.Locale

object StreamingAvailabilityUtils {

    /** Fallback country used when the user's country has no availability data. */
    const val FALLBACK_COUNTRY = "US"

    /** Normalized availability entries: grouped `availabilities` when the API
     *  provides them, otherwise the legacy flat fields of the service. */
    fun entries(service: StreamingServiceDto): List<AvailabilityEntryDto> {
        val grouped = service.availabilities
        return if (!grouped.isNullOrEmpty()) grouped else listOf(
            AvailabilityEntryDto(
                availability_type = service.availability_type,
                available_from = service.release_date,
                is_coming_soon = service.is_coming_soon,
                countries = service.countries
            )
        )
    }

    /** An entry covers a country when it is unrestricted or lists that code. */
    fun covers(entry: AvailabilityEntryDto, code: String): Boolean {
        val countries = entry.countries
        if (countries.isNullOrEmpty()) return true
        val target = code.trim().uppercase(Locale.ROOT)
        return countries.any { it.code?.trim()?.uppercase(Locale.ROOT) == target }
    }

    /**
     * Preview list for the Film Detail page: one card per service (deduped),
     * kept when it covers the user's country, the US fallback, or has no
     * country restriction. A null userCountry shows everything.
     */
    fun filterForPreview(
        services: List<StreamingServiceDto>,
        userCountry: String?
    ): List<StreamingServiceDto> {
        val distinct = services.distinctBy { it.id }
        if (userCountry.isNullOrBlank()) return distinct
        val target = userCountry.trim().uppercase(Locale.ROOT)
        return distinct.filter { service ->
            entries(service).any { covers(it, target) || covers(it, FALLBACK_COUNTRY) }
        }
    }

    /** Country shown on the preview flag: the user's country when anything
     *  covers it, otherwise the US fallback, otherwise null (hide the flag). */
    fun selectCountry(service: StreamingServiceDto, userCountry: String?): String? {
        if (userCountry.isNullOrBlank()) return null
        val target = userCountry.trim().uppercase(Locale.ROOT)
        val es = entries(service)
        return when {
            es.any { covers(it, target) } -> target
            es.any { covers(it, FALLBACK_COUNTRY) } -> FALLBACK_COUNTRY
            else -> null
        }
    }

    /** One renderable row of the Streaming Availability screen. */
    data class AvailabilityRow(
        val countryCode: String?,   // null = available in all countries
        val countryName: String,
        val type: String,
        val isComingSoon: Boolean,
        val date: String?
    )

    /**
     * Rows of a service for the Streaming Availability screen, filtered by the
     * selected country NAME (unrestricted rows always stay visible).
     */
    fun rowsFor(service: StreamingServiceDto, countryName: String?): List<AvailabilityRow> {
        val rows = mutableListOf<AvailabilityRow>()
        for (entry in entries(service)) {
            val countries: List<CountryAvailabilityDto?> = entry.countries
                ?.takeIf { it.isNotEmpty() }
                ?: listOf(null)
            for (country in countries) {
                if (country != null && !countryName.isNullOrBlank() &&
                    !country.name.equals(countryName, ignoreCase = true)
                ) {
                    continue
                }
                rows.add(
                    AvailabilityRow(
                        countryCode = country?.code,
                        countryName = country?.name?.takeIf { it.isNotBlank() }
                            ?: country?.code ?: "All Countries",
                        type = entry.availability_type,
                        isComingSoon = entry.is_coming_soon,
                        date = entry.available_from
                    )
                )
            }
        }
        return rows
    }

    /**
     * Filter services by a full country NAME (selection from the country
     * filter sheet): keep services that have at least one visible row.
     * Services without country restriction always stay visible.
     */
    fun filterByCountry(
        services: List<StreamingServiceDto>,
        countryName: String?
    ): List<StreamingServiceDto> {
        if (countryName.isNullOrBlank()) return services
        return services.filter { rowsFor(it, countryName).isNotEmpty() }
    }
}
