# Earning Quiz App - Dokumentasi Front-End

## 📱 Deskripsi Aplikasi
Aplikasi Kuis Penghasil Uang (Earning Quiz App) adalah aplikasi mobile Android yang memungkinkan pengguna untuk mendapatkan koin melalui kuis dan fitur bonus, kemudian menukarkannya dengan uang tunai.

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Splash Screen** ✓
- **File**: `SplashActivity.kt` & `activity_splash.xml`
- **Fitur**:
  - Menampilkan logo dan teks "Earning Quiz App"
  - Otomatis navigasi ke halaman autentikasi setelah 3 detik
  - Loading indicator
  - Fullscreen dengan background warna primary

### 2. **Halaman Autentikasi** ✓
- **File**: `AuthActivity.kt`, `LoginFragment.kt`, `SignupFragment.kt`
- **Layout**: `activity_auth.xml`, `fragment_login.xml`, `fragment_signup.xml`
- **Fitur**:
  - **Tab Layout** dengan 2 tab: Login dan Sign Up
  - **Form Login**:
    - Input: Email, Password
    - Validasi form
    - Simpan session ke SharedPreferences
  - **Form Sign Up**:
    - Input: Username, Email, Password
    - Validasi (termasuk password minimal 6 karakter)
    - Bonus 100 koin untuk user baru
    - Simpan data ke SharedPreferences

### 3. **Halaman Beranda (Home Screen)** ✓
- **File**: `HomeActivity.kt`, `CategoryAdapter.kt`
- **Layout**: `activity_home.xml`, `item_category.xml`
- **Fitur**:
  - Sapaan pengguna dinamis ("Halo, [Nama]!")
  - Tampilan total koin dengan desain menarik
  - **Grid Kategori Kuis** (2 kolom):
    - 8 Kategori: Sains, Sejarah, Teknologi, Matematika, Bahasa, Geografi, Olahraga, Seni
    - Card dengan icon emoji dan warna berbeda
    - Responsive dan clickable
  - **Bottom Navigation** untuk navigasi cepat

### 4. **Halaman Spin Wheel (Bonus)** ✓
- **File**: `SpinActivity.kt`
- **Layout**: `activity_spin.xml`
- **Fitur**:
  - UI roda putar (wheel) dengan animasi
  - Tombol "SPIN" untuk memutar roda
  - Animasi rotasi 3 detik dengan DecelerateInterpolator
  - Reward random 10-100 koin per spin
  - Update koin secara real-time
  - Tampilan total koin di header
  - Informasi reward di bagian bawah

### 5. **Halaman Penarikan (Withdrawal)** ✓
- **File**: `WithdrawalActivity.kt`
- **Layout**: `activity_withdrawal.xml`
- **Fitur**:
  - Tampilan koin tersedia (available coins)
  - **Form Input**:
    - Jumlah penarikan (minimal 1000 koin)
    - Dropdown metode pembayaran (DANA, OVO, GoPay, ShopeePay, LinkAja, Bank Transfer)
    - Nomor akun/telepon
  - Validasi lengkap untuk semua input
  - Dialog konfirmasi sebelum penarikan
  - Info card dengan informasi penting
  - Konversi: 1000 koin = Rp 10.000
  - Update saldo setelah penarikan
  - Dialog success setelah berhasil

## 📁 Struktur Folder

```
app/src/main/
├── java/com/komputerkit/earningapp/
│   ├── MainActivity.kt
│   ├── screens/
│   │   ├── SplashActivity.kt
│   │   ├── AuthActivity.kt
│   │   ├── LoginFragment.kt
│   │   ├── SignupFragment.kt
│   │   ├── HomeActivity.kt
│   │   ├── SpinActivity.kt
│   │   └── WithdrawalActivity.kt
│   └── widgets/
│       └── CategoryAdapter.kt
│
└── res/
    ├── layout/
    │   ├── activity_splash.xml
    │   ├── activity_auth.xml
    │   ├── fragment_login.xml
    │   ├── fragment_signup.xml
    │   ├── activity_home.xml
    │   ├── item_category.xml
    │   ├── activity_spin.xml
    │   └── activity_withdrawal.xml
    ├── menu/
    │   └── bottom_nav_menu.xml
    ├── drawable/
    │   ├── coin_background.xml
    │   └── spin_wheel.xml
    ├── values/
    │   ├── colors.xml
    │   └── strings.xml
    └── AndroidManifest.xml
```

## 🎨 Desain & UI

### Warna Tema
- **Primary**: #6200EE (Ungu)
- **Primary Dark**: #3700B3
- **Accent**: #03DAC5 (Cyan)
- **Background**: #F5F5F5 (Light Gray)

### Komponen UI
- Material Design Components
- CardView untuk kategori
- RecyclerView dengan GridLayoutManager
- Bottom Navigation View
- TextInputLayout dengan outline style
- Spinner untuk dropdown
- ConstraintLayout & LinearLayout

## 🔄 Alur Aplikasi

1. **Launch App** → Splash Screen (3 detik)
2. **Authentication** → Login/Sign Up
3. **Home Screen** → Pilih kategori kuis atau navigasi
4. **Bottom Navigation**:
   - Home → Halaman beranda
   - Spin Wheel → Dapatkan koin bonus
   - Withdrawal → Tarik dana

## 💾 Data Persistence

Menggunakan **SharedPreferences** untuk menyimpan:
- Status login (`isLoggedIn`)
- Username (`userName`)
- Email (`userEmail`)
- Total koin (`userCoins`)

## 🔧 Dependensi

```kotlin
// build.gradle.kts (app level)
dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
}
```

## ✨ Fitur Tambahan yang Sudah Ada

1. **Back Navigation** di semua Activity
2. **Form Validation** di semua input
3. **Toast Messages** untuk feedback
4. **Dialog Konfirmasi** di Withdrawal
5. **Animasi** pada Spin Wheel
6. **Session Management** dengan SharedPreferences

## 🚀 Cara Menjalankan

1. Buka project di Android Studio
2. Sync Gradle
3. Run aplikasi:
   ```bash
   ./gradlew assembleDebug
   ```
4. Install APK di device/emulator

## 📝 Catatan Pengembangan

### Yang Sudah Selesai:
- ✅ Struktur folder screens & widgets
- ✅ Splash Screen
- ✅ Authentication (Login & Sign Up)
- ✅ Home Screen dengan kategori grid
- ✅ Spin Wheel dengan animasi
- ✅ Withdrawal Screen dengan form lengkap
- ✅ Bottom Navigation
- ✅ Material Design
- ✅ Data persistence

### Untuk Pengembangan Lanjutan:
- Quiz Activity (halaman kuis)
- API Integration untuk backend
- Database (Room) untuk offline storage
- Profile Screen
- History/Transaction Screen
- Notifikasi
- Leaderboard
- Firebase Authentication
- Payment Gateway Integration

## 🎯 Status Build

✅ **BUILD SUCCESSFUL** - Aplikasi siap untuk dijalankan!

---

**Dibuat dengan**: Kotlin, Android SDK, Material Design
**Min SDK**: 24 (Android 7.0)
**Target SDK**: 36
