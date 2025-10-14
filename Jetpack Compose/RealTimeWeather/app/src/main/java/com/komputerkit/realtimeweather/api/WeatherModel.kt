package com.komputerkit.realtimeweather.api

import com.google.gson.annotations.SerializedName

data class WeatherModel(
    @SerializedName("location")
    val location: Location,
    @SerializedName("current")
    val current: Current
)

data class Location(
    @SerializedName("name")
    val name: String,
    @SerializedName("region")
    val region: String,
    @SerializedName("country")
    val country: String,
    @SerializedName("lat")
    val lat: String,
    @SerializedName("lon")
    val lon: String,
    @SerializedName("tz_id")
    val tzId: String,
    @SerializedName("localtime_epoch")
    val localtimeEpoch: String,
    @SerializedName("localtime")
    val localtime: String
)

data class Current(
    @SerializedName("last_updated_epoch")
    val lastUpdatedEpoch: String,
    @SerializedName("last_updated")
    val lastUpdated: String,
    @SerializedName("temp_c")
    val tempC: String,
    @SerializedName("temp_f")
    val tempF: String,
    @SerializedName("is_day")
    val isDay: String,
    @SerializedName("condition")
    val condition: Condition,
    @SerializedName("wind_mph")
    val windMph: String,
    @SerializedName("wind_kph")
    val windKph: String,
    @SerializedName("wind_degree")
    val windDegree: String,
    @SerializedName("wind_dir")
    val windDir: String,
    @SerializedName("pressure_mb")
    val pressureMb: String,
    @SerializedName("pressure_in")
    val pressureIn: String,
    @SerializedName("precip_mm")
    val precipMm: String,
    @SerializedName("precip_in")
    val precipIn: String,
    @SerializedName("humidity")
    val humidity: String,
    @SerializedName("cloud")
    val cloud: String,
    @SerializedName("feelslike_c")
    val feelslikeC: String,
    @SerializedName("feelslike_f")
    val feelslikeF: String,
    @SerializedName("windchill_c")
    val windchillC: String,
    @SerializedName("windchill_f")
    val windchillF: String,
    @SerializedName("heatindex_c")
    val heatindexC: String,
    @SerializedName("heatindex_f")
    val heatindexF: String,
    @SerializedName("dewpoint_c")
    val dewpointC: String,
    @SerializedName("dewpoint_f")
    val dewpointF: String,
    @SerializedName("vis_km")
    val visKm: String,
    @SerializedName("vis_miles")
    val visMiles: String,
    @SerializedName("uv")
    val uv: String,
    @SerializedName("gust_mph")
    val gustMph: String,
    @SerializedName("gust_kph")
    val gustKph: String
)

data class Condition(
    @SerializedName("text")
    val text: String,
    @SerializedName("icon")
    val icon: String,
    @SerializedName("code")
    val code: String
)