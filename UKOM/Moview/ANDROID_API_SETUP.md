# Panduan Integrasi API Laravel ke Android

## ✅ Yang Sudah Dilakukan:

### 1. Dependencies ditambahkan di `app/build.gradle.kts`:
- Retrofit 2.9.0 (untuk HTTP requests)
- Gson Converter (untuk JSON parsing)
- OkHttp Logging Interceptor (untuk debug)
- Kotlin Coroutines (untuk async operations)

### 2. File Baru yang Dibuat:

#### a. `data/api/ApiModels.kt`
Model data untuk response API dari Laravel

#### b. `data/api/MovieApiService.kt`
Interface Retrofit untuk endpoint API:
- GET /home
- GET /popular
- GET /recent-reviews
- GET /movies
- GET /movies/{id}
- GET /search

#### c. `data/api/RetrofitClient.kt`
Konfigurasi Retrofit client dengan logging

### 3. File yang Diupdate:

#### a. `data/repository/MovieRepository.kt`
- Menambahkan fungsi `suspend` untuk API calls
- Konversi DTO to Model
- Error handling

#### b. `ui/home/HomeViewModel.kt`
- Menggunakan `viewModelScope.launch` untuk coroutines
- Loading state
- Error handling

#### c. `AndroidManifest.xml`
- Menambahkan `usesCleartextTraffic="true"` untuk HTTP

---

## 🔧 CARA SETUP & TESTING:

### Langkah 1: Update IP Address

**PENTING!** Buka file `RetrofitClient.kt` dan ubah BASE_URL:

```kotlin
// Pilih salah satu:

// A. Jika menggunakan Emulator Android Studio:
private const val BASE_URL = "http://10.0.2.2:8000/api/v1/"

// B. Jika menggunakan Device Fisik atau Emulator lain:
// 1. Cek IP komputer Anda: buka Command Prompt dan ketik: ipconfig
// 2. Cari "IPv4 Address" di adapter WiFi/Ethernet Anda
// 3. Ganti IP di bawah dengan IP komputer Anda:
private const val BASE_URL = "http://192.168.1.100:8000/api/v1/"
```

### Langkah 2: Pastikan Laravel Server Berjalan

```bash
cd D:\UKOM\Moview_backend
php artisan serve --host=0.0.0.0 --port=8000
```

**Note:** `--host=0.0.0.0` penting agar server bisa diakses dari device lain!

### Langkah 3: Test API dari Browser/Postman

Buka browser dan test:
```
http://127.0.0.1:8000/api/v1/home
http://127.0.0.1:8000/api/v1/popular
```

Jika berhasil, Anda akan lihat JSON response.

### Langkah 4: Sync Gradle di Android Studio

1. Buka Android Studio
2. Klik **File** → **Sync Project with Gradle Files**
3. Tunggu sampai selesai download dependencies

### Langkah 5: Build dan Run Android App

1. Pastikan emulator atau device sudah terhubung
2. Klik tombol **Run** (▶️) di Android Studio
3. Pilih device/emulator
4. Tunggu app ter-install dan berjalan

### Langkah 6: Check Logcat untuk Debug

Buka Logcat di Android Studio dan filter dengan:
- Tag: `OkHttp` (untuk melihat HTTP requests/responses)
- Tag: `System.err` (untuk melihat errors)

---

## 📱 APA YANG BERUBAH DI APLIKASI:

### Home Screen sekarang akan:
✅ Mengambil data "Popular This Week" dari database Laravel
✅ Mengambil data "New From Friends" dari database Laravel
✅ Menampilkan film yang ada di database, bukan data dummy
✅ Menampilkan rating dan watched count yang real

### Jika ada masalah:
- Check Logcat untuk error messages
- Pastikan Laravel server running
- Pastikan IP address benar
- Pastikan firewall tidak blocking port 8000

---

## 🐛 TROUBLESHOOTING:

### 1. "Failed to connect" atau "Connection refused"
**Solusi:**
- Pastikan Laravel server running dengan `--host=0.0.0.0`
- Check IP address di RetrofitClient.kt
- Jika pakai emulator: gunakan `10.0.2.2` bukan `localhost`
- Jika pakai device fisik: pastikan di WiFi yang sama dengan komputer

### 2. "Cleartext HTTP traffic not permitted"
**Solusi:** Sudah ditambahkan `usesCleartextTraffic="true"` di AndroidManifest.xml

### 3. Data masih kosong/dummy
**Solusi:**
- Check Logcat untuk error API
- Pastikan database Laravel memiliki data film
- Test API endpoint dari browser dulu

### 4. Build error "Unresolved reference: kotlinx"
**Solusi:** Sync Gradle lagi atau Clean Project (Build → Clean Project)

---

## 📊 MONITORING API CALLS:

Di Logcat, Anda akan melihat output seperti ini jika API sukses:

```
D/OkHttp: --> GET http://10.0.2.2:8000/api/v1/home
D/OkHttp: <-- 200 OK http://10.0.2.2:8000/api/v1/home (150ms)
D/OkHttp: {"success":true,"data":{"popular_this_week":[...]}}
```

---

## 🎯 NEXT STEPS:

Setelah home screen berhasil, Anda bisa:
1. Integrasikan halaman Movie Detail dengan API `/movies/{id}`
2. Integrasikan Search dengan API `/search?q={query}`
3. Tambahkan loading indicator saat fetch data
4. Tambahkan error state UI
5. Implement pagination untuk list

---

**Created by:** Laravel-Android Integration Helper
**Date:** January 30, 2026
