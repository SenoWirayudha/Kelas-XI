# 🎯 Quick Start - Mendapatkan Token dalam 3 Langkah

## Langkah 1️⃣ : Start Server Laravel

```bash
cd "d:\PJBL Jetpack Compose\Aplikasi Monitoring Sekolah\backendaplikasimonitoring"
php artisan serve
```

✅ Lihat pesan: `Server running on [http://127.0.0.1:8000]`

---

## Langkah 2️⃣ : Login di Postman

### Setup Request:
```
Method: POST
URL: http://127.0.0.1:8000/api/login
```

### Headers:
```
Content-Type: application/json
Accept: application/json
```

### Body (JSON):
```json
{
    "email": "admin@sekolah.com",
    "password": "password"
}
```

### Klik SEND ▶️

---

## Langkah 3️⃣ : Copy Token

Response yang Anda terima:
```json
{
    "token": "3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "user": {
        "id": 1,
        "name": "Admin",
        "email": "admin@sekolah.com",
        "role": "admin"
    }
}
```

### ✅ COPY BAGIAN INI:
```
3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

---

## ✅ Selesai! Sekarang Gunakan Token

Untuk request selanjutnya, tambahkan di Headers:

```
Authorization: Bearer 3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
Accept: application/json
```

⚠️ **PENTING:** Ada spasi antara `Bearer` dan token!

---

## 🧪 Test Token - Coba Request Ini

```
Method: GET
URL: http://127.0.0.1:8000/api/gurus

Headers:
Authorization: Bearer 3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
Accept: application/json
```

Jika berhasil, Anda akan melihat list guru! 🎉

---

## 👥 Akun Login Tersedia

| Email | Password | Role |
|-------|----------|------|
| admin@sekolah.com | password | Admin |
| kurikulum@sekolah.com | password | Kurikulum |
| kepalasekolah@sekolah.com | password | Kepala Sekolah |
| siswa1@sekolah.com | password | Siswa |
| siswa2@sekolah.com | password | Siswa |

---

## ❌ Troubleshooting

### Error: "Unauthenticated"
- ✅ Pastikan token sudah di-paste dengan benar
- ✅ Harus ada spasi: `Bearer {token}`
- ✅ Login ulang untuk dapat token baru

### Error: "Unable to connect"
- ✅ Pastikan Laravel server running
- ✅ Jalankan: `php artisan serve`

---

📖 **Detail Lengkap:** Baca `CARA_MENDAPATKAN_TOKEN.md`
