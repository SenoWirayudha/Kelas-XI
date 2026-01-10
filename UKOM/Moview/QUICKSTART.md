# Moview App - Quick Start Guide

## 🎬 Tentang Aplikasi

Moview adalah aplikasi Android untuk review dan rating film yang dibangun menggunakan:
- **Bahasa**: Kotlin
- **Arsitektur**: MVVM (Model-View-ViewModel)
- **Min SDK**: Android 7.0 (API 24)
- **Target SDK**: Android 14+ (API 36)

## 📋 Checklist Setup

- [x] Gradle configuration
- [x] Dependencies (Navigation, ViewModel, LiveData, Glide)
- [x] Model classes (Movie, User, Review, FriendActivity)
- [x] Repository with dummy data
- [x] ViewModels untuk semua screens
- [x] Bottom Navigation setup
- [x] HomeFragment dengan 2 RecyclerViews
- [x] Adapters (PopularMovieAdapter, FriendActivityAdapter)
- [x] Navigation Component integration
- [x] Layouts dan resources

## 🏃 Cara Build dan Run

### Option 1: Android Studio
1. Buka project di Android Studio
2. Tunggu Gradle sync selesai
3. Klik Run button (▶️) atau tekan Shift+F10
4. Pilih emulator atau device fisik

### Option 2: Command Line
```bash
# Windows
cd d:\UKOM\Moview
.\gradlew.bat assembleDebug
.\gradlew.bat installDebug

# Linux/Mac
cd /path/to/Moview
./gradlew assembleDebug
./gradlew installDebug
```

## 📱 Fitur yang Sudah Diimplementasi

### ✅ Bottom Navigation (4 menu)
- Home (sudah ada konten)
- Search (placeholder)
- Notification (placeholder)
- Profile (placeholder)

### ✅ Home Screen

#### Section 1: "Populer Minggu Ini"
- Horizontal scrolling RecyclerView
- 8 film populer dengan:
  - Poster image
  - Judul film
  - Rating bintang
- Click listener pada setiap item

#### Section 2: "New From Friend"
- Vertical scrolling RecyclerView
- 6 aktivitas teman dengan:
  - Poster film (large)
  - Profile photo (circular)
  - Username
  - Rating stars
  - Like count
  - Rewatch icon (conditional)
  - More menu icon (jika ada review)
- Click listener untuk:
  - Item card (show info)
  - More menu (show review)

## 🎯 Interaksi yang Bisa Dicoba

1. **Scroll Horizontal** di section "Populer Minggu Ini"
2. **Tap Film Populer** → Akan muncul Toast dengan judul film
3. **Scroll Vertical** di section "New From Friend"
4. **Tap Aktivitas Teman** → Toast dengan info user & film
5. **Tap Icon Menu (3 titik)** → Toast dengan review lengkap
6. **Tap Bottom Navigation** → Berpindah antar screens

## 🔧 Struktur File Penting

```
app/src/main/
├── java/com/komputerkit/moview/
│   ├── MainActivity.kt                 # Entry point
│   ├── data/
│   │   ├── model/                      # Data classes
│   │   └── repository/                 # Data provider
│   └── ui/
│       └── home/
│           ├── HomeFragment.kt         # Main screen
│           ├── HomeViewModel.kt        # Business logic
│           └── adapter/                # RecyclerView adapters
└── res/
    ├── layout/                         # XML layouts
    ├── drawable/                       # Icons
    ├── menu/                          # Bottom nav menu
    └── navigation/                    # Navigation graph
```

## 🎨 Custom Resources

### Icons
- `ic_home.xml` - Home icon
- `ic_search.xml` - Search icon
- `ic_notification.xml` - Notification icon
- `ic_profile.xml` - Profile icon
- `ic_star.xml` - Star/rating icon (gold)
- `ic_like.xml` - Like icon
- `ic_rewatch.xml` - Rewatch icon
- `ic_more.xml` - More menu icon

### Colors
- `placeholder_color` - #CCCCCC untuk image placeholder

## 📊 Dummy Data

### Popular Movies (8 items)
1. The Shawshank Redemption (4.8★)
2. The Godfather (4.7★)
3. The Dark Knight (4.6★)
4. Pulp Fiction (4.5★)
5. Forrest Gump (4.4★)
6. Inception (4.5★)
7. The Matrix (4.4★)
8. Interstellar (4.6★)

### Friend Activities (6 items)
- john_cinema → The Shawshank Redemption (5.0★, 24 likes, has review)
- sarah_films → The Dark Knight (4.5★, 18 likes, rewatch)
- mike_reviews → Inception (4.8★, 32 likes, has review)
- emma_movie → Interstellar (5.0★, 45 likes, rewatch + review)
- david_watch → Forrest Gump (4.0★, 12 likes)
- john_cinema → Pulp Fiction (4.7★, 28 likes, rewatch + review)

## 🐛 Troubleshooting

### Gradle Sync Failed
```bash
# Clean dan rebuild
.\gradlew.bat clean
.\gradlew.bat build --refresh-dependencies
```

### Images Tidak Muncul
- Images menggunakan placeholder URL (https://via.placeholder.com)
- Pastikan emulator/device ada koneksi internet
- Atau ganti dengan local drawable resources

### App Crash
- Check Logcat untuk error message
- Pastikan minSdk device >= 24
- Verify all dependencies ter-install

### Bottom Navigation Tidak Berfungsi
- Check nav_graph.xml IDs match dengan menu IDs
- Pastikan NavHostFragment ter-setup di MainActivity

## 📈 Next Steps untuk Development

1. **Search Feature**
   - Add SearchView di SearchFragment
   - Filter movies berdasarkan title/genre
   - Show hasil dalam RecyclerView

2. **Notification Feature**
   - List notifikasi (likes, comments, follows)
   - Mark as read functionality

3. **Profile Feature**
   - User info display
   - Edit profile
   - User's reviews list

4. **Detail Screen**
   - Movie detail dengan full info
   - List semua reviews
   - Write review functionality

5. **Backend Integration**
   - Replace Repository dengan API calls
   - Authentication system
   - Real-time updates

## 📚 Learning Resources

### Kotlin & Android
- [Kotlin Bootcamp](https://developer.android.com/courses/kotlin-bootcamp/overview)
- [Android Basics in Kotlin](https://developer.android.com/courses/android-basics-kotlin/course)

### MVVM Architecture
- [Guide to App Architecture](https://developer.android.com/topic/architecture)
- [ViewModel Overview](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [LiveData Overview](https://developer.android.com/topic/libraries/architecture/livedata)

### UI Components
- [RecyclerView](https://developer.android.com/guide/topics/ui/layout/recyclerview)
- [Navigation Component](https://developer.android.com/guide/navigation)
- [Material Design](https://material.io/develop/android)

## ✨ Tips

1. **ViewBinding**: Sudah diaktifkan, gunakan untuk semua layout
2. **LiveData**: Observe di onViewCreated, bukan onCreate
3. **Adapter**: Gunakan ViewHolder pattern untuk performa
4. **Images**: Glide handle caching otomatis
5. **Navigation**: Gunakan Safe Args untuk type-safe navigation

## 📞 Support

Untuk pertanyaan atau issue:
1. Check error di Logcat
2. Baca DEVELOPMENT_GUIDE.md untuk detail teknis
3. Review kode di GitHub

---
**Happy Coding! 🚀**
