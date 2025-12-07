# 🌤️ Android Weather App

A beautiful and feature-rich weather application built with Kotlin for Android that provides current weather information with dynamic UI changes based on weather conditions.

## ✨ Features

- **Splash Screen**: Beautiful animated splash screen with smooth transitions
- **Current Weather Display**: Temperature, humidity, pressure, wind speed, and visibility
- **Location-Based Weather**: Get weather for your current location using GPS
- **City Search**: Search for weather in any city worldwide
- **Dynamic UI**: Background and icons change based on weather conditions
- **Weather Conditions Support**: Sunny, cloudy, rainy, snowy, thunderstorm, and foggy weather
- **Error Handling**: Comprehensive error handling for network issues and invalid searches
- **Material Design**: Modern Android UI following Material Design guidelines

## 🛠️ Technologies Used

- **Language**: Kotlin
- **Architecture**: MVVM with LiveData
- **Networking**: Retrofit 2 with Gson converter
- **Image Loading**: Glide
- **Location Services**: Google Play Services Location
- **API**: OpenWeatherMap API
- **UI**: Material Design Components, CardView, Vector Drawables

## 📋 Prerequisites

- Android Studio Arctic Fox or later
- Android SDK 24+ (Android 7.0)
- OpenWeatherMap API key (free registration required)

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/weather-app.git
cd weather-app
```

### 2. Get OpenWeatherMap API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key

### 3. Add API Key to the Project
1. Open `app/src/main/java/com/komputerkit/weatherapp/api/WeatherApiService.kt`
2. Replace `"YOUR_API_KEY_HERE"` with your actual API key:
```kotlin
companion object {
    const val BASE_URL = "https://api.openweathermap.org/data/2.5/"
    const val API_KEY = "your_actual_api_key_here"
}
```

### 4. Build and Run
1. Open the project in Android Studio
2. Sync the project with Gradle files
3. Connect your Android device or start an emulator
4. Click "Run" or press Ctrl+R (Cmd+R on Mac)

## 📱 App Flow

1. **Splash Screen** → Displays for 3 seconds with loading animation
2. **Main Screen** → Search for cities or use current location button
3. **Weather Display** → Beautiful weather cards with detailed information
4. **Dynamic UI** → Background and icons automatically change based on weather

## 🎨 Weather Conditions & UI Changes

| Weather Condition | Background Color | Icon |
|-------------------|------------------|------|
| Clear/Sunny | Yellow to Orange Gradient | Sun with rays |
| Cloudy | Grey to Dark Grey Gradient | Cloud |
| Rainy/Drizzle | Blue Gradient | Cloud with rain drops |
| Snow | Light Blue to Blue Gradient | Cloud with snowflakes |
| Thunderstorm | Dark Grey to Black Gradient | Cloud with lightning |
| Foggy/Misty | Light Grey Gradient | Cloud with mist lines |

## 🔧 Key Components

### Activities
- `SplashActivity` - App launch screen with animation
- `MainActivity` - Main weather interface

### Data Models
- `WeatherResponse` - Main API response model
- `Weather` - Weather condition details
- `Main` - Temperature and atmospheric data
- `Wind` - Wind information
- `Clouds` - Cloud coverage data
- `Sys` - System/location data

### API Service
- `WeatherApiService` - Retrofit interface for API calls
- `WeatherApiClient` - HTTP client configuration

## 🔒 Permissions

The app requires the following permissions:
- `INTERNET` - For API calls to fetch weather data
- `ACCESS_NETWORK_STATE` - To check network connectivity
- `ACCESS_FINE_LOCATION` - For precise location-based weather
- `ACCESS_COARSE_LOCATION` - For approximate location-based weather

## 🎯 API Endpoints Used

- **Current Weather by City**: `GET /weather?q={city}&appid={apikey}&units=metric`
- **Current Weather by Coordinates**: `GET /weather?lat={lat}&lon={lon}&appid={apikey}&units=metric`

## 🐛 Troubleshooting

### Common Issues

1. **"API key required" error**
   - Make sure you've added your OpenWeatherMap API key to `WeatherApiService.kt`

2. **Location not working**
   - Ensure location permissions are granted
   - Check if GPS is enabled on your device

3. **Network errors**
   - Verify internet connection
   - Check if API key is valid and active

4. **City not found**
   - Check spelling of city name
   - Try using "City, Country" format (e.g., "London, UK")

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed description

## 🙏 Acknowledgments

- [OpenWeatherMap](https://openweathermap.org/) for providing the weather API
- [Material Design](https://material.io/) for design guidelines
- [Retrofit](https://square.github.io/retrofit/) for networking
- [Glide](https://github.com/bumptech/glide) for image loading

---

Made with ❤️ for Android developers
