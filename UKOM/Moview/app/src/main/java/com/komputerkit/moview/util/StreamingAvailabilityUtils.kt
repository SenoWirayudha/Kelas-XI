package com.komputerkit.moview.util

import com.komputerkit.moview.data.api.StreamingServiceDto
import java.util.Locale

object StreamingAvailabilityUtils {

    /** Fallback country used when the user's country has no availability data. */
    const val FALLBACK_COUNTRY = "US"

    /**
     * Preview list for the Film Detail page: keep services available in the
     * user's country, available in the US fallback, or with no country
     * restriction (null/empty countries list = unrestricted).
     * A null userCountry (detection unavailable) shows everything.
     */
    fun filterForPreview(
        services: List<StreamingServiceDto>,
        userCountry: String?
    ): List<StreamingServiceDto> {
        if (userCountry.isNullOrBlank()) return services
        val target = userCountry.trim().uppercase(Locale.ROOT)
        return services.filter { matchesCountry(it, target) }
    }

    /**
     * Filter by a full country NAME (selection from the country filter sheet).
     * Services without country restriction always stay visible.
     */
    fun filterByCountry(
        services: List<StreamingServiceDto>,
        countryName: String?
    ): List<StreamingServiceDto> {
        if (countryName.isNullOrBlank()) return services
        return services.filter { service ->
            val countries = service.countries
            countries.isNullOrEmpty() ||
                countries.any { it.name.equals(countryName, ignoreCase = true) }
        }
    }

    private fun matchesCountry(service: StreamingServiceDto, target: String): Boolean {
        val countries = service.countries ?: return true
        if (countries.isEmpty()) return true
        return countries.any { c ->
            val code = c.code?.trim()?.uppercase(Locale.ROOT)
            code == target || code == FALLBACK_COUNTRY
        }
    }
}
