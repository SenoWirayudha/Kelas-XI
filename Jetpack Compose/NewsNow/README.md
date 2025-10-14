# NewsNow - Aplikasi Berita Android dengan Jetpack Compose

Aplikasi berita modern yang dibangun dengan Jetpack Compose menggunakan arsitektur MVVM dan terintegrasi dengan News API.

## 🚀 Fitur

### ✅ Sudah Diimplementasikan:
- **Arsitektur MVVM** dengan separation of concerns yang jelas
- **Pengambilan Data** dari News API menggunakan Retrofit
- **Home Screen** dengan daftar berita dalam LazyColumn
- **Filter Kategori** horizontal yang dapat di-scroll (General, Business, Technology, dll.)
- **Pencarian Berita** dengan endpoint "Everything" dari News API
- **Navigation** menggunakan Type-Safe Navigation Compose
- **Article Detail Screen** dengan WebView untuk membaca artikel lengkap
- **News Card Component** dengan gambar, judul, dan sumber berita menggunakan Coil
- **Loading States** dan **Error Handling** yang komprehensif
- **Material Design 3** dengan tema modern

## 🛠 Teknologi yang Digunakan

- **Jetpack Compose** - Modern UI toolkit
- **Navigation Compose** - Type-safe navigation
- **ViewModel & LiveData** - State management
- **Retrofit** - HTTP client untuk API calls
- **Coil** - Image loading library
- **Coroutines** - Asynchronous programming
- **Material Design 3** - UI components
- **MVVM Architecture** - Clean architecture pattern

## 📋 Setup Instructions

### 1. Dapatkan API Key dari News API
1. Kunjungi [newsapi.org](https://newsapi.org/)
2. Buat akun gratis
3. Dapatkan API key Anda

### 2. Konfigurasi API Key
Buka file `NewsRepository.kt` dan ganti `YOUR_API_KEY_HERE` dengan API key Anda:

```kotlin
private val apiKey = "YOUR_ACTUAL_API_KEY_HERE"
```

### 3. Build dan Run
1. Sync project dengan Gradle
2. Build aplikasi
3. Run di emulator atau device Android (minimum SDK 24)

## 📱 Cara Menggunakan

### Home Screen
- **Lihat Berita Utama**: Daftar top headlines akan dimuat otomatis
- **Filter Kategori**: Tap chip kategori di bagian atas untuk filter berita
- **Pencarian**: Tap ikon search → masukkan kata kunci → tap search

### Article Detail
- **Buka Artikel**: Tap card berita untuk membuka artikel lengkap di WebView
- **Navigasi**: Gunakan tombol back untuk kembali ke daftar berita

## 🏗 Struktur Project

```
app/src/main/java/com/komputerkit/newsnow/
├── data/
│   ├── api/
│   │   ├── NewsApiClient.kt      # Retrofit client setup
│   │   └── NewsApiService.kt     # API interface
│   ├── model/
│   │   └── NewsModels.kt         # Data models (Article, Source, NewsResponse)
│   └── repository/
│       └── NewsRepository.kt     # Data layer abstraction
├── navigation/
│   ├── Routes.kt                 # Type-safe navigation routes
│   └── NewsNavigation.kt         # Navigation setup
├── ui/
│   ├── components/
│   │   └── NewsCard.kt           # Reusable news card component
│   ├── screens/
│   │   ├── HomeScreen.kt         # Main news list screen
│   │   └── ArticleDetailScreen.kt # Article WebView screen
│   └── theme/                    # Material Design theme
├── viewmodel/
│   └── NewsViewModel.kt          # MVVM ViewModel
└── MainActivity.kt               # Entry point
```

## 🔧 Arsitektur MVVM

### Model
- `Article`, `Source`, `NewsResponse` - Data models untuk News API
- `Resource<T>` - Sealed class untuk handling loading/success/error states

### View
- `HomeScreen` - Compose UI untuk daftar berita dan pencarian
- `ArticleDetailScreen` - Compose UI dengan WebView untuk detail artikel
- `NewsCard` - Reusable component untuk item berita

### ViewModel
- `NewsViewModel` - Mengelola UI state dan business logic
- Menggunakan StateFlow untuk reactive state management
- Menangani kategori filter, pencarian, dan pengambilan data

### Repository
- `NewsRepository` - Abstraction layer untuk data access
- Menangani API calls dan response mapping

## 📦 Dependencies

Aplikasi ini menggunakan dependencies berikut:

```kotlin
// Navigation Compose
implementation("androidx.navigation:navigation-compose:2.7.6")

// ViewModel & LiveData  
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
implementation("androidx.compose.runtime:runtime-livedata:1.5.8")

// Retrofit for API calls
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// Coil for image loading
implementation("io.coil-kt:coil-compose:2.5.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

// Serialization for type-safe navigation
implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

// Material Icons Extended
implementation("androidx.compose.material:material-icons-extended:1.5.8")
```

## 🔐 Permissions

Aplikasi memerlukan permissions berikut di AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 🎯 Future Enhancements

Beberapa fitur yang dapat ditambahkan:

- [ ] **Offline Storage** dengan Room Database
- [ ] **Pull-to-Refresh** untuk update berita
- [ ] **Pagination** untuk load more articles
- [ ] **Bookmark/Favorites** functionality
- [ ] **Dark Mode** support
- [ ] **Share Article** functionality
- [ ] **Push Notifications** untuk breaking news
- [ ] **Settings Screen** untuk konfigurasi
- [ ] **Unit Tests** dan **UI Tests**
- [ ] **Hilt/Dagger** untuk dependency injection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [News API](https://newsapi.org/) untuk providing free news data
- [Material Design](https://material.io/) untuk design guidelines
- [Jetpack Compose](https://developer.android.com/jetpack/compose) team untuk amazing UI toolkit