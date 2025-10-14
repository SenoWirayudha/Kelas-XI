# SiswaActivity - Aplikasi Monitoring Kelas

## Overview
SiswaActivity adalah halaman khusus untuk siswa yang dapat diakses setelah login dengan role "Siswa".

---

## 📱 Fitur SiswaActivity

### **Bottom Navigation dengan 3 Menu:**

#### 1. **📅 Jadwal Pelajaran (Icons.Default.DateRange)**
- Menampilkan jadwal pelajaran siswa
- Informasi yang ditampilkan:
  - Hari
  - Jam mulai - jam selesai
  - Mata pelajaran
  - Nama guru
  - Ruangan
- Menggunakan LazyColumn untuk list jadwal
- Setiap item jadwal ditampilkan dalam Card

#### 2. **✏️ Entri (Icons.Default.Edit)**
- Form untuk mencatat kegiatan belajar harian
- Field yang tersedia:
  - Mata Pelajaran (required)
  - Topik Pembelajaran (required)
  - Catatan (optional, multiline)
- Button "Simpan Entri" yang disabled jika field required kosong
- Menampilkan pesan sukses setelah data disimpan
- Form otomatis reset setelah submit
- Info card dengan petunjuk penggunaan

#### 3. **📋 List (Icons.Default.List)**
- Menampilkan daftar kegiatan belajar yang sudah diinput
- Summary card menampilkan:
  - Total kegiatan
  - Jumlah kegiatan selesai
- Setiap kegiatan menampilkan:
  - Tanggal
  - Status (badge)
  - Mata pelajaran
  - Topik
  - Catatan
- Menggunakan LazyColumn untuk scroll

---

## 📁 File Structure

```
app/src/main/java/com/komputerkit/aplikasimonitoringkelas/
├── SiswaActivity.kt                    # Activity utama siswa
└── siswa/
    └── screens/
        ├── JadwalPelajaranScreen.kt    # Screen jadwal pelajaran
        ├── EntriScreen.kt              # Screen form entri
        └── ListScreen.kt               # Screen list kegiatan
```

---

## 🎨 Komponen UI

### **Bottom Navigation**
```kotlin
NavigationBar {
    - Jadwal (DateRange icon)
    - Entri (Edit icon)
    - List (List icon)
}
```

### **TopAppBar** (di setiap screen)
- Menampilkan judul screen
- Menampilkan email user
- Background: primaryContainer color

---

## 🔄 Alur Navigasi

```
LoginActivity (pilih role "Siswa")
    ↓
SiswaActivity
    ├─→ Jadwal Pelajaran (default)
    ├─→ Entri
    └─→ List
```

---

## 💾 Data Sample

### Jadwal Pelajaran
- 7 mata pelajaran contoh dengan jadwal lengkap
- Hari: Senin, Selasa, Rabu
- Jam: 07:00 - 11:45
- Ruangan: R.101, R.102, Lab IPA, dll.

### List Kegiatan
- 6 kegiatan belajar contoh
- Status: Selesai
- Data terurut berdasarkan tanggal terbaru

---

## 🎯 Fitur Utama

### ✅ State Management
- Menggunakan `remember` dan `mutableStateOf`
- Navigation state dengan NavController
- Form validation real-time

### ✅ Material Design 3
- Menggunakan Material3 components
- Color scheme: primary, surface, container
- Elevation dan card styling
- Responsive layout

### ✅ Navigation
- Bottom navigation dengan state persistence
- Single top launch (tidak duplikat)
- Smooth transition antar screen

---

## 🚀 Cara Menggunakan

1. Login dengan role "Siswa"
2. Aplikasi otomatis membuka SiswaActivity
3. Default screen: Jadwal Pelajaran
4. Navigasi menggunakan bottom navigation:
   - Tap **Jadwal** untuk melihat jadwal pelajaran
   - Tap **Entri** untuk input kegiatan baru
   - Tap **List** untuk melihat riwayat kegiatan

---

## 📊 Icons yang Digunakan

| Menu | Icon | Keterangan |
|------|------|------------|
| Jadwal Pelajaran | `Icons.Default.DateRange` | 📅 Icon kalender |
| Entri | `Icons.Default.Edit` | ✏️ Icon edit/tulis |
| List | `Icons.Default.List` | 📋 Icon list |

---

## ✨ Build Status
✅ **BUILD SUCCESSFUL** - SiswaActivity siap digunakan!

---

## 📝 Notes

- Semua screen sudah responsive dan menggunakan Material3
- Data sample hardcoded untuk demonstrasi
- Dapat dikembangkan dengan backend integration
- Form validation sudah terimplementasi
- State management menggunakan Compose state
