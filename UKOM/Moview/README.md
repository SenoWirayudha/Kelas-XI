# Moview - Aplikasi Review Film Android

Aplikasi Android untuk memberikan review dan rating film dengan arsitektur MVVM (Model-View-ViewModel).

## 📱 Fitur Utama

### 1. Bottom Navigation
- **Home**: Menampilkan film populer dan aktivitas teman
- **Search**: Pencarian film (coming soon)
- **Notification**: Notifikasi aktivitas (coming soon)
- **Profile**: Profil pengguna (coming soon)

### 2. Halaman Home

#### Section "Populer Minggu Ini"
- Menampilkan daftar film populer dalam format horizontal scrolling
- Setiap item menampilkan:
  - Poster film
  - Judul film
  - Rating rata-rata (dengan ikon bintang)

#### Section "New From Friend"
- Menampilkan aktivitas review terbaru dari teman
- Setiap item menampilkan:
  - Poster film (utama)
  - Foto profil teman
  - Username
  - Rating bintang
  - Jumlah like
  - Ikon rewatch (jika applicable)
  - Ikon menu (untuk review lengkap)

## 🏗️ Arsitektur

### MVVM (Model-View-ViewModel)

```
app/
├── data/
│   ├── model/
│   │   ├── Movie.kt
│   │   ├── User.kt
│   │   ├── Review.kt
│   │   └── FriendActivity.kt
│   └── repository/
│       └── MovieRepository.kt
├── ui/
│   ├── home/
│   │   ├── HomeFragment.kt
│   │   ├── HomeViewModel.kt
│   │   └── adapter/
│   │       ├── PopularMovieAdapter.kt
│   │       └── FriendActivityAdapter.kt
│   ├── search/
│   │   ├── SearchFragment.kt
│   │   └── SearchViewModel.kt
│   ├── notification/
│   │   ├── NotificationFragment.kt
│   │   └── NotificationViewModel.kt
│   └── profile/
│       ├── ProfileFragment.kt
│       └── ProfileViewModel.kt
└── MainActivity.kt
```

### Komponen Arsitektur

#### 1. Model (Data Layer)
- `Movie`: Data class untuk informasi film
- `User`: Data class untuk informasi pengguna
- `Review`: Data class untuk review film
- `FriendActivity`: Data class untuk aktivitas teman

#### 2. Repository
- `MovieRepository`: Menyediakan dummy data untuk film populer dan aktivitas teman
- Menggunakan Repository Pattern untuk abstraksi sumber data

#### 3. ViewModel
- `HomeViewModel`: Mengelola state untuk HomeFragment
- Menggunakan LiveData untuk observable data
- Memisahkan logic dari UI

#### 4. View (UI Layer)
- Fragment untuk setiap screen
- RecyclerView dengan custom adapters
- ViewBinding untuk type-safe view access

## 🛠️ Teknologi & Libraries

### Core
- **Kotlin**: Bahasa pemrograman utama
- **Android SDK**: Min SDK 24, Target SDK 36

### Architecture Components
- **Navigation Component**: Navigasi antar fragment
- **ViewModel**: Lifecycle-aware UI state management
- **LiveData**: Observable data holder
- **ViewBinding**: Type-safe view binding

### UI Components
- **Material Design Components**: Bottom Navigation, CardView, dll.
- **RecyclerView**: Efficient list rendering
- **ConstraintLayout**: Flexible layout design

### Image Loading
- **Glide**: Image loading dan caching

## 📦 Dependencies

```gradle
// Navigation Component
implementation("androidx.navigation:navigation-fragment-ktx:2.8.7")
implementation("androidx.navigation:navigation-ui-ktx:2.8.7")

// Lifecycle & ViewModel
implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.9.4")
implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.9.4")

// Fragment
implementation("androidx.fragment:fragment-ktx:1.8.7")

// Glide
implementation("com.github.bumptech.glide:glide:4.16.0")
```

## 🚀 Cara Menjalankan

1. Clone atau download repository
2. Buka project di Android Studio
3. Sync Gradle files
4. Jalankan aplikasi di emulator atau device fisik

```bash
# Build debug APK
./gradlew assembleDebug

# Install di device yang terhubung
./gradlew installDebug
```

## 📝 Data Dummy

Aplikasi menggunakan dummy data yang didefinisikan di `MovieRepository`:
- 8 film populer dengan informasi lengkap
- 5 user dengan profil
- 6 aktivitas teman dengan berbagai status (rewatch, review, dll)

## 🎨 UI/UX Design Principles

- **Material Design**: Mengikuti guideline Material Design
- **Clean Layout**: Design yang simple dan mudah dipahami
- **Responsive**: Mendukung berbagai ukuran layar
- **Accessibility**: Menggunakan contentDescription untuk semua image

## 🔄 State Management

- **LiveData**: Untuk observable data dari ViewModel ke Fragment
- **ViewBinding**: Menghindari findViewById dan null pointer
- **Lifecycle-aware**: ViewModel bertahan configuration changes

## 📱 Navigation Flow

```
MainActivity
└── BottomNavigationView
    ├── HomeFragment (Default)
    ├── SearchFragment
    ├── NotificationFragment
    └── ProfileFragment
```

## 🎯 Future Enhancements

- [ ] Implementasi Search functionality
- [ ] Notification system
- [ ] User profile management
- [ ] Backend integration (API)
- [ ] Local database (Room)
- [ ] Authentication system
- [ ] Write review functionality
- [ ] Like/Unlike functionality
- [ ] Follow/Unfollow users
- [ ] Filter dan sorting movies

## 📄 License

Educational project - UKOM

## 👨‍💻 Developer

Aplikasi ini dibuat sebagai pembelajaran arsitektur MVVM di Android dengan Kotlin.
