# API Configuration Summary

## 📦 Struktur API Layer

```
app/src/main/java/com/komputerkit/aplikasimonitoringkelas/
├── api/
│   ├── ApiClient.kt           # Retrofit singleton client
│   ├── ApiConfig.kt           # Base URL configuration
│   ├── ApiHelper.kt           # Safe API call wrapper
│   ├── ApiService.kt          # API endpoints interface
│   ├── TokenManager.kt        # Token & session management
│   └── models/
│       └── AuthModels.kt      # Data models
└── viewmodel/
    └── AuthViewModel.kt       # Authentication ViewModel
```

## 🔧 Configuration

### Base URL
- **Emulator**: `http://10.0.2.2:8000/api/`
- **Device**: `http://[YOUR_IP]:8000/api/` (ganti dengan IP laptop Anda)
- **Genymotion**: `http://10.0.3.2:8000/api/`

### Dependencies Added
- Retrofit 2.9.0
- OkHttp 4.12.0
- Gson 2.10.1
- Logging Interceptor

### Permissions Added
- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `usesCleartextTraffic="true"`

## 🚀 Usage Example

### Basic Login Implementation

```kotlin
// 1. Initialize ViewModel
val authViewModel = AuthViewModel(context)

// 2. Observe login state
val loginState by authViewModel.loginState.collectAsState()

// 3. Call login
authViewModel.login("user@example.com", "password")

// 4. Handle result
when (loginState) {
    is ApiResult.Success -> {
        // Navigate to main screen
    }
    is ApiResult.Error -> {
        // Show error message
    }
    is ApiResult.Loading -> {
        // Show loading indicator
    }
}
```

### Making Authenticated Requests

```kotlin
// Get token from TokenManager
val tokenManager = TokenManager(context)
val authHeader = tokenManager.getAuthHeader() // Returns "Bearer TOKEN"

// Use in API call
val apiService = ApiClient.getApiService()
val result = apiService.getCurrentUser(authHeader)
```

## 📝 Available Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/register | POST | No | Register new user |
| /api/login | POST | No | Login user |
| /api/logout | POST | Yes | Logout user |
| /api/user | GET | Yes | Get current user |

## 🔐 Token Management

```kotlin
val tokenManager = TokenManager(context)

// Save token after login
tokenManager.saveToken(token)
tokenManager.saveUserData(id, name, email)

// Get token
val token = tokenManager.getToken()
val authHeader = tokenManager.getAuthHeader()

// Check login status
val isLoggedIn = tokenManager.isLoggedIn()

// Logout
tokenManager.clearAll()
```

## 🐛 Troubleshooting

### Cannot connect to backend
- Pastikan Laravel server running: `php artisan serve`
- Gunakan `10.0.2.2` untuk emulator, bukan `localhost`
- Untuk device fisik, gunakan IP address laptop

### CORS Error
- CORS middleware sudah dikonfigurasi di backend
- Restart Laravel server jika perlu

### JSON Parsing Error
- Cek response format di Logcat
- Pastikan model data sesuai dengan response API

## 📚 Documentation

Lihat dokumentasi lengkap di:
- `API_INTEGRATION_GUIDE.md` - Panduan lengkap integrasi
- `QUICK_START_TESTING.md` - Panduan testing cepat

## ✅ Status

**Setup Complete!** ✨

Backend Laravel dan Android app sudah dikonfigurasi dan siap digunakan untuk development.

### Next Steps:
1. Start Laravel server: `php artisan serve`
2. Update Base URL di `ApiConfig.kt` sesuai environment
3. Sync Gradle dan run aplikasi
4. Test login dengan credentials yang ada
5. Check Logcat untuk debugging

---

Last Updated: October 8, 2025
