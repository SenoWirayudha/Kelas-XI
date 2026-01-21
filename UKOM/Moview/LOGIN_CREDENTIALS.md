# Login Credentials

## Dummy User Accounts

Gunakan salah satu kredensial berikut untuk login:

### User 1
- **Email**: user@moview.com
- **Password**: password123

### User 2
- **Email**: admin@moview.com
- **Password**: admin123

### User 3
- **Email**: test@moview.com
- **Password**: test123

## Cara Login

### Pertama Kali Buka Aplikasi:
1. Saat aplikasi dibuka, akan langsung mengarah ke halaman **Login**
2. Masukkan email (contoh: `user@moview.com`)
3. Masukkan password (contoh: `password123`)
4. Klik tombol **"Log In"**
5. Tunggu loading (2 detik) - akan muncul "Logging in..."
6. Jika berhasil, akan otomatis masuk ke **Home**

### Jika Sudah Pernah Login:
- Ketika aplikasi dibuka lagi, akan **langsung masuk ke Home** (tidak perlu login lagi)
- Login state tersimpan di SharedPreferences

### Cara Logout:
1. Buka aplikasi (akan masuk Home otomatis jika sudah login)
2. Navigasi ke **Profile** (icon paling kanan di bottom navigation)
3. Klik **Edit Profile** (icon pensil di kanan atas)
4. Scroll ke bawah, klik tombol **"Log Out"** (tombol merah)
5. Akan redirect ke halaman Login
6. Saat buka aplikasi lagi, akan kembali ke halaman Login (karena sudah logout)

## Fitur Login

- ✅ Validasi email format
- ✅ Show/hide password toggle (icon mata)
- ✅ Loading state saat login dengan animasi
- ✅ Simpan status login dengan SharedPreferences
- ✅ Auto-redirect: 
  - **Sudah login** → Langsung ke Home
  - **Belum/Sudah logout** → Ke Login
- ✅ Navigasi otomatis ke Home setelah login sukses
- ✅ Logout akan clear session dan redirect ke Login
- ✅ Bottom navigation disembunyikan di halaman login
- ✅ Halaman login dapat di-scroll
- ✅ "Don't have an account? Sign Up" tersedia (coming soon)

## Alur Aplikasi

```
Buka App
   ↓
Check Login Status (SharedPreferences)
   ↓
├─ Sudah Login? → Home Screen → Bisa explore app
└─ Belum Login? → Login Screen → Masukkan kredensial → Home Screen
```
