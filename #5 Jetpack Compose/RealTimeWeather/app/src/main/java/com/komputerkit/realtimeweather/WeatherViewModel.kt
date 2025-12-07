package com.komputerkit.realtimeweather

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.realtimeweather.api.NetworkResponse
import com.komputerkit.realtimeweather.api.RetrofitInstance
import com.komputerkit.realtimeweather.api.WeatherModel
import kotlinx.coroutines.launch

class WeatherViewModel : ViewModel() {
    private val weatherApi = RetrofitInstance.api
    private val _weatherResult = MutableLiveData<NetworkResponse<WeatherModel>>()
    val weatherResult: MutableLiveData<NetworkResponse<WeatherModel>> = _weatherResult

    fun getData(city: String) {
        _weatherResult.value = NetworkResponse.Loading()
        
        viewModelScope.launch {
            try {
                val response = weatherApi.getWeather(Constants.API_KEY, city)
                if (response.isSuccessful && response.body() != null) {
                    _weatherResult.value = NetworkResponse.Success(response.body()!!)
                } else {
                    _weatherResult.value = NetworkResponse.Error("Failed to load data")
                }
            } catch (e: Exception) {
                _weatherResult.value = NetworkResponse.Error(e.message ?: "An error occurred")
            }
        }
    }
}