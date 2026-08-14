package com.komputerkit.moview.data.model

data class MovieRelease(
    val type: String,
    val typeLabel: String,
    val countryCode: String? = null,
    val countryName: String? = null,
    val flagEmoji: String? = null,
    val name: String? = null,
    val releaseDate: String? = null
)
