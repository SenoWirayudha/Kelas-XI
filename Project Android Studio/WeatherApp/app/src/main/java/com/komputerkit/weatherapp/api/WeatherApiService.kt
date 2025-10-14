package com.komputerkit.weatherapp.api

import com.komputerkit.weatherapp.model.WeatherResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface WeatherApiService {
    
    @GET("weather")
    suspend fun getCurrentWeather(
        @Query("q") cityName: String,
        @Query("appid") apiKey: String,
        @Query("units") units: String = "metric"
    ): Response<WeatherResponse>
    
    @GET("weather")
    suspend fun getCurrentWeatherByCoordinates(
        @Query("lat") latitude: Double,
        @Query("lon") longitude: Double,
        @Query("appid") apiKey: String,
        @Query("units") units: String = "metric"
    ): Response<WeatherResponse>
    
    companion object {
        const val BASE_URL = "https://api.openweathermap.org/data/2.5/"
        // Get your free API key from: https://openweathermap.org/api
        const val API_KEY = "cd9cdc5aff71c37062b1e5e865540429"
    }
}
