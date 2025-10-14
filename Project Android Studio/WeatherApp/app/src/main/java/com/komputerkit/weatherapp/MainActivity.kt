package com.komputerkit.weatherapp

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.komputerkit.weatherapp.api.WeatherApiClient
import com.komputerkit.weatherapp.api.WeatherApiService
import com.komputerkit.weatherapp.model.WeatherResponse
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {
    
    private lateinit var searchEditText: EditText
    private lateinit var searchButton: Button
    private var locationButton: ImageButton? = null
    private lateinit var weatherCard: View
    private var progressBar: ProgressBar? = null
    private lateinit var errorTextView: TextView
    
    // Weather UI elements
    private lateinit var locationTextView: TextView
    private lateinit var dayTextView: TextView
    private lateinit var dateTextView: TextView
    private lateinit var weatherIconImageView: ImageView
    private lateinit var temperatureTextView: TextView
    private lateinit var minMaxTextView: TextView
    private lateinit var descriptionTextView: TextView
    private lateinit var humidityTextView: TextView
    private lateinit var windSpeedTextView: TextView
    private lateinit var rainConditionTextView: TextView
    private lateinit var sunriseTextView: TextView
    private lateinit var sunsetTextView: TextView
    private lateinit var pressureTextView: TextView
    
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    
    companion object {
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1001
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        initViews()
        setupListeners()
        setupLocationClient()
        updateDate()
        
        // Set default background
        updateBackground("default")
        
        // Hide weather card initially - show empty UI
        weatherCard.visibility = View.GONE
        errorTextView.visibility = View.GONE
        
        // Show welcome message
        Toast.makeText(this, "Enter a city name to get weather information", Toast.LENGTH_LONG).show()
    }
    
    private fun initViews() {
        searchEditText = findViewById(R.id.etCity)
        searchButton = findViewById(R.id.btnSearch)
        weatherIconImageView = findViewById(R.id.ivWeatherIcon)
        temperatureTextView = findViewById(R.id.tvTemperature)
        descriptionTextView = findViewById(R.id.tvDescription)
        locationTextView = findViewById(R.id.tvCityName)
        
        // Now we have all the actual views
        weatherCard = findViewById(R.id.weatherCard)
        progressBar = null  // No progress bar in this layout
        errorTextView = findViewById(R.id.tvError) // Use dedicated error TextView
        dayTextView = findViewById(R.id.tvTitle) // Use title for day
        dateTextView = findViewById(R.id.tvTitle) // Use title for date
        minMaxTextView = findViewById(R.id.tvMinMax) // Now we have a dedicated view
        humidityTextView = findViewById(R.id.tvHumidity) // Now we have a dedicated view
        windSpeedTextView = findViewById(R.id.tvWindSpeed) // Now we have a dedicated view
        rainConditionTextView = findViewById(R.id.tvConditions) // Now we have a dedicated view
        sunriseTextView = findViewById(R.id.tvSunrise) // Now we have a dedicated view
        sunsetTextView = findViewById(R.id.tvSunset) // Now we have a dedicated view
        pressureTextView = findViewById(R.id.tvPressure) // Now we have a dedicated view
        locationButton = null // No location button in this layout
    }
    
    private fun setupListeners() {
        searchButton.setOnClickListener {
            val cityName = searchEditText.text.toString().trim()
            if (cityName.isNotEmpty()) {
                fetchWeatherByCity(cityName)
            } else {
                Toast.makeText(this, "Please enter a city name", Toast.LENGTH_SHORT).show()
            }
        }
        
        // Location button is not available in simplified layout
        // locationButton.setOnClickListener {
        //     requestLocationPermissionAndFetchWeather()
        // }
        
        searchEditText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                searchButton.performClick()
                true
            } else {
                false
            }
        }
    }
    
    private fun setupLocationClient() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }
    
    private fun updateDate() {
        val dateFormat = SimpleDateFormat("dd MMMM yyyy", Locale.getDefault())
        val dayFormat = SimpleDateFormat("EEEE", Locale.getDefault())
        val currentDate = Date()
        
        dateTextView.text = dateFormat.format(currentDate)
        dayTextView.text = dayFormat.format(currentDate)
    }
    
    private fun requestLocationPermissionAndFetchWeather() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
            == PackageManager.PERMISSION_GRANTED) {
            fetchWeatherByLocation()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                LOCATION_PERMISSION_REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            LOCATION_PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    fetchWeatherByLocation()
                } else {
                    Toast.makeText(this, getString(R.string.location_permission_denied), Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun fetchWeatherByLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            return
        }
        
        showLoading()
        
        fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
            if (location != null) {
                fetchWeatherByCoordinates(location.latitude, location.longitude)
            } else {
                hideLoading()
                showError("Unable to get current location. Please try again or search manually.")
            }
        }.addOnFailureListener {
            hideLoading()
            showError("Failed to get location. Please try again.")
        }
    }
    
    private fun fetchWeatherByCity(cityName: String) {
        // If using demo API key, show demo data for any search
        if (WeatherApiService.API_KEY.contains("demo_key") || WeatherApiService.API_KEY == "YOUR_API_KEY_HERE") {
            showDemoWeatherDataForCity(cityName)
            return
        }
        
        showLoading()
        
        lifecycleScope.launch {
            try {
                val response = WeatherApiClient.apiService.getCurrentWeather(
                    cityName = cityName,
                    apiKey = WeatherApiService.API_KEY
                )
                
                if (response.isSuccessful) {
                    response.body()?.let { weatherResponse ->
                        updateWeatherUI(weatherResponse)
                    } ?: run {
                        showError(getString(R.string.error_general))
                    }
                } else {
                    when (response.code()) {
                        404 -> showError(getString(R.string.error_city_not_found))
                        401 -> showError("Invalid API key. Please check your OpenWeatherMap API key.")
                        else -> showError(getString(R.string.error_network))
                    }
                }
            } catch (e: Exception) {
                showError("Network error: ${e.message}")
            } finally {
                hideLoading()
            }
        }
    }
    
    private fun fetchWeatherByCoordinates(latitude: Double, longitude: Double) {
        // If using demo API key, show demo data
        if (WeatherApiService.API_KEY.contains("demo_key") || WeatherApiService.API_KEY == "YOUR_API_KEY_HERE") {
            showDemoWeatherData()
            return
        }
        
        showLoading()
        
        lifecycleScope.launch {
            try {
                val response = WeatherApiClient.apiService.getCurrentWeatherByCoordinates(
                    latitude = latitude,
                    longitude = longitude,
                    apiKey = WeatherApiService.API_KEY
                )
                
                if (response.isSuccessful) {
                    response.body()?.let { weatherResponse ->
                        updateWeatherUI(weatherResponse)
                    } ?: run {
                        showError(getString(R.string.error_general))
                    }
                } else {
                    when (response.code()) {
                        401 -> showError("Invalid API key. Please check your OpenWeatherMap API key.")
                        else -> showError(getString(R.string.error_network))
                    }
                }
            } catch (e: Exception) {
                showError("Network error: ${e.message}")
            } finally {
                hideLoading()
            }
        }
    }
    
    private fun updateWeatherUI(weather: WeatherResponse) {
        // Update location
        val country = weather.sys.country
        locationTextView.text = "${weather.name}, $country"
        
        // Update temperature
        val temp = weather.main.temp.toInt()
        val tempMin = weather.main.tempMin.toInt()
        val tempMax = weather.main.tempMax.toInt()
        temperatureTextView.text = "${temp}°C"
        minMaxTextView.text = "Min:${tempMin}.00° Max:${tempMax}.00°"
        
        // Update weather description
        val description = weather.weather[0].main.uppercase()
        descriptionTextView.text = description
        
        // Update weather details
        humidityTextView.text = "${weather.main.humidity}"
        windSpeedTextView.text = String.format("%.2f", weather.wind.speed)
        pressureTextView.text = "${weather.main.pressure / 10}" // Convert to simplified format
        
        // Update rain condition
        rainConditionTextView.text = when (weather.weather[0].main.lowercase()) {
            "rain", "drizzle" -> "Rain"
            "snow" -> "Snow"
            "thunderstorm" -> "Storm"
            "clouds" -> "Cloud"
            else -> "Clear"
        }
        
        // Update sunrise and sunset (convert from unix timestamp)
        val sunriseTime = formatTime(weather.sys.sunrise)
        val sunsetTime = formatTime(weather.sys.sunset)
        sunriseTextView.text = sunriseTime
        sunsetTextView.text = sunsetTime
        
        // Update weather icon based on condition
        updateWeatherIcon(weather.weather[0].main, weather.weather[0].icon)
        
        // Update background based on weather condition
        updateBackground(weather.weather[0].main)
        
        // Debug log
        println("Weather condition: ${weather.weather[0].main}")
        println("Weather description: ${weather.weather[0].description}")
        
        // Show weather card
        weatherCard.visibility = View.VISIBLE
        errorTextView.visibility = View.GONE
    }
    
    private fun formatTime(unixTime: Long): String {
        val date = Date(unixTime * 1000)
        val format = SimpleDateFormat("HH:mm", Locale.getDefault())
        return format.format(date)
    }
    
    private fun updateWeatherIcon(weatherMain: String, iconCode: String) {
        val iconResource = when (weatherMain.lowercase()) {
            "clear" -> R.drawable.ic_sun
            "clouds" -> R.drawable.ic_cloud
            "rain", "drizzle" -> R.drawable.ic_rain
            "snow" -> R.drawable.ic_snow
            "thunderstorm" -> R.drawable.ic_thunderstorm
            "mist", "fog", "haze" -> R.drawable.ic_foggy
            else -> R.drawable.ic_sun
        }
        weatherIconImageView.setImageResource(iconResource)
    }
    
    private fun updateBackground(weatherMain: String) {
        val backgroundResource = when (weatherMain.lowercase()) {
            "clear" -> R.drawable.bg_sun
            "clouds" -> R.drawable.bg_cloud
            "rain", "drizzle" -> R.drawable.bg_rain
            "snow" -> R.drawable.bg_snow
            "thunderstorm" -> R.drawable.bg_thunderstorm
            else -> R.drawable.bg_default
        }
        
        // Debug log
        println("Setting background for weather: ${weatherMain.lowercase()}")
        println("Background resource: $backgroundResource")
        
        // Update background using main layout
        runOnUiThread {
            val mainLayout = findViewById<ScrollView>(R.id.mainLayout)
            mainLayout?.setBackgroundResource(backgroundResource)
        }
    }
    
    private fun showLoading() {
        progressBar?.visibility = View.VISIBLE // Use safe call for nullable progressBar
        weatherCard.visibility = View.GONE
        errorTextView.visibility = View.GONE
    }
    
    private fun hideLoading() {
        progressBar?.visibility = View.GONE // Use safe call for nullable progressBar
    }
    
    private fun showError(message: String) {
        hideLoading()
        weatherCard.visibility = View.GONE
        errorTextView.text = message
        errorTextView.visibility = View.VISIBLE
    }
    
    private fun showDemoWeatherData() {
        // Create demo weather data
        locationTextView.text = "Jakarta, ID"
        temperatureTextView.text = "28°C"
        minMaxTextView.text = "Min:25.00° Max:31.00°"
        descriptionTextView.text = "SUNNY"
        humidityTextView.text = "75"
        windSpeedTextView.text = "3.20"
        rainConditionTextView.text = "Clear"
        sunriseTextView.text = "06:15"
        sunsetTextView.text = "18:45"
        pressureTextView.text = "101"
        
        // Set sunny weather icon and background
        weatherIconImageView.setImageResource(R.drawable.ic_sun)
        updateBackground("clear")
        
        // Show weather card
        weatherCard.visibility = View.VISIBLE
        errorTextView.visibility = View.GONE
        
        // Show info about demo data
        Toast.makeText(this, "Demo weather data shown. Add your OpenWeatherMap API key for real data.", Toast.LENGTH_LONG).show()
    }
    
    private fun showDemoWeatherDataForCity(cityName: String) {
        // Create demo weather data based on city
        val demoData = when (cityName.lowercase()) {
            "jakarta" -> Triple("Jakarta, ID", "28°C", "clear")
            "london" -> Triple("London, UK", "15°C", "clouds")
            "tokyo" -> Triple("Tokyo, JP", "22°C", "clear")
            "new york" -> Triple("New York, US", "18°C", "rain")
            "sydney" -> Triple("Sydney, AU", "25°C", "clear")
            "moscow" -> Triple("Moscow, RU", "-5°C", "snow")
            "paris" -> Triple("Paris, FR", "16°C", "clouds")
            "miami" -> Triple("Miami, US", "30°C", "thunderstorm")
            "hokkaido" -> Triple("Hokkaido, JP", "19°C", "rain")
            "sapporo" -> Triple("Sapporo, JP", "18°C", "rain")
            "osaka" -> Triple("Osaka, JP", "24°C", "clouds")
            "kyoto" -> Triple("Kyoto, JP", "23°C", "rain")
            else -> {
                // City not found - show error
                showError("City not found. Please check the spelling and try again.")
                return
            }
        }
        
        // Update basic weather info
        locationTextView.text = demoData.first
        temperatureTextView.text = demoData.second
        val tempValue = demoData.second.replace("°C", "").toIntOrNull() ?: 20
        minMaxTextView.text = "Min:${tempValue-3}.00° Max:${tempValue+3}.00°"
        
        // Update detailed weather info
        humidityTextView.text = "${(60..85).random()}%"
        pressureTextView.text = "${(1000..1020).random()} hPa"
        windSpeedTextView.text = String.format("%.2f m/s", (15..85).random() / 10.0)
        sunriseTextView.text = "06:${(10..30).random()}"
        sunsetTextView.text = "18:${(30..50).random()}"
        
        when (demoData.third) {
            "clear" -> {
                descriptionTextView.text = "SUNNY"
                weatherIconImageView.setImageResource(R.drawable.ic_sun)
                updateBackground("clear")
                rainConditionTextView.text = "Clear"
            }
            "clouds" -> {
                descriptionTextView.text = "CLOUDY"
                weatherIconImageView.setImageResource(R.drawable.ic_cloud)
                updateBackground("clouds")
                rainConditionTextView.text = "Cloudy"
            }
            "rain" -> {
                descriptionTextView.text = "RAINY"
                weatherIconImageView.setImageResource(R.drawable.ic_rain)
                updateBackground("rain")
                rainConditionTextView.text = "Rain"
            }
            "snow" -> {
                descriptionTextView.text = "SNOWY"
                weatherIconImageView.setImageResource(R.drawable.ic_snow)
                updateBackground("snow")
                rainConditionTextView.text = "Snow"
            }
            "thunderstorm" -> {
                descriptionTextView.text = "STORMY"
                weatherIconImageView.setImageResource(R.drawable.ic_thunderstorm)
                updateBackground("thunderstorm")
                rainConditionTextView.text = "Storm"
            }
        }
        
        // Show weather card and hide error
        weatherCard.visibility = View.VISIBLE
        errorTextView.visibility = View.GONE
        
        Toast.makeText(this, "Demo data for $cityName. Get real weather with API key!", Toast.LENGTH_SHORT).show()
    }
}