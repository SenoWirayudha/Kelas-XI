# Login Screen - Aplikasi Monitoring Kelas

## Fitur Login Screen

### 1. Logo Sekolah
- Logo berada di bagian atas form
- Ukuran: 120dp x 120dp
- Menampilkan ikon gedung sekolah dengan bendera

### 2. Spinner/Dropdown Role
- Pilihan role: Siswa, Kurikulum, Kepala Sekolah, Admin
- Menggunakan ExposedDropdownMenuBox dari Material3
- Wajib dipilih sebelum login

### 3. Email TextField
- OutlinedTextField dengan keyboard type Email
- Validasi format email otomatis
- Menampilkan error message jika format salah
- Placeholder: "contoh@email.com"

### 4. Password TextField
- OutlinedTextField dengan PasswordVisualTransformation
- Teks password disembunyikan (****)
- Tombol toggle untuk show/hide password (emoji mata)
- Keyboard type: Password

### 5. Button Login
- Button akan disabled jika:
  - Role belum dipilih
  - Email kosong atau format salah
  - Password kosong
- Setelah login berhasil, navigasi ke MainActivity
- Menampilkan Toast message dengan informasi role dan email

## File Structure

```
app/src/main/java/com/komputerkit/aplikasimonitoringkelas/
├── LoginActivity.kt          # Activity utama untuk login
├── MainActivity.kt            # Activity utama aplikasi
└── preview/
    └── LoginPreview.kt       # Preview untuk Android Studio

app/src/main/res/
└── drawable/
    └── logo_sekolah.xml      # Logo sekolah vector drawable
```

## Cara Menggunakan

1. Aplikasi akan membuka LoginActivity saat pertama kali dijalankan
2. Pilih role dari dropdown
3. Masukkan email dengan format yang benar
4. Masukkan password
5. Klik tombol Login
6. Setelah berhasil, akan otomatis ke MainActivity dengan bottom navigation

## Validasi

- **Email**: Hanya menerima format email yang valid (menggunakan Patterns.EMAIL_ADDRESS)
- **Password**: Minimal harus diisi (bisa ditambahkan validasi lebih lanjut)
- **Role**: Harus dipilih salah satu dari dropdown

## Navigasi

LoginActivity → MainActivity (setelah login berhasil)
- Data yang dikirim: ROLE dan EMAIL melalui Intent extras
