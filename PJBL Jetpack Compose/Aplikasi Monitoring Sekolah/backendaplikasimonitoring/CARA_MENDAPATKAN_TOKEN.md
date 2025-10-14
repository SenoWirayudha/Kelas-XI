# 🔑 Cara Mendapatkan Bearer Token - Tutorial Lengkap

## ⚠️ PENTING: Token Diperlukan Untuk Semua Request API

Semua endpoint API (kecuali `/login` dan `/register`) **memerlukan Bearer Token** untuk autentikasi.

---

## 📋 Langkah-Langkah Mendapatkan Token

### **Langkah 1: Pastikan Laravel Server Berjalan**

Buka terminal dan jalankan:

```bash
cd "d:\PJBL Jetpack Compose\Aplikasi Monitoring Sekolah\backendaplikasimonitoring"
php artisan serve
```

Anda akan melihat:
```
INFO  Server running on [http://127.0.0.1:8000].
```

**Jangan tutup terminal ini!** Biarkan server tetap berjalan.

---

### **Langkah 2: Buka Postman**

1. Download dan install Postman jika belum ada: https://www.postman.com/downloads/
2. Buka Postman
3. Buat Collection baru (opsional, tapi disarankan)

---

### **Langkah 3: Buat Request Login**

#### **A. Set Method dan URL:**
- Method: **POST**
- URL: `http://127.0.0.1:8000/api/login`

#### **B. Set Headers:**

Klik tab **Headers**, tambahkan 2 header:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

#### **C. Set Body:**

1. Klik tab **Body**
2. Pilih radio button **raw**
3. Dropdown di sebelah kanan pilih **JSON**
4. Masukkan JSON berikut:

```json
{
    "email": "admin@sekolah.com",
    "password": "password"
}
```

#### **D. Klik Send**

---

### **Langkah 4: Copy Token dari Response**

Setelah klik Send, Anda akan mendapat response seperti ini:

```json
{
    "token": "3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGh",
    "user": {
        "id": 1,
        "name": "Admin",
        "email": "admin@sekolah.com",
        "role": "admin"
    }
}
```

**COPY token tersebut!** Ini adalah Bearer Token Anda.

Contoh token:
```
3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGh
```

---

### **Langkah 5: Gunakan Token di Request Lain**

Sekarang setiap kali Anda ingin memanggil endpoint API lain, tambahkan token ini di **Headers**.

#### **Cara Manual (Setiap Request):**

Di setiap request, tambahkan header:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer 3|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGh` |
| `Accept` | `application/json` |

⚠️ **PENTING:** Harus ada spasi antara `Bearer` dan token!

Format: `Bearer {token}`

---

#### **Cara Otomatis (Rekomendasi - Collection Level):**

**Lebih efisien!** Set token sekali untuk semua request:

1. Klik Collection Anda
2. Klik tab **Authorization**
3. Type: Pilih **Bearer Token**
4. Token: Paste token Anda (tanpa kata "Bearer")
5. Save Collection

Sekarang semua request dalam collection akan otomatis menggunakan token ini!

---

## 🎯 Contoh Lengkap di Postman

### **Request 1: Login (Dapat Token)**

```
POST http://127.0.0.1:8000/api/login

Headers:
Content-Type: application/json
Accept: application/json

Body (raw JSON):
{
    "email": "admin@sekolah.com",
    "password": "password"
}

Response:
{
    "token": "3|xyz123abc456...",
    "user": {...}
}
```

**✅ Copy token: `3|xyz123abc456...`**

---

### **Request 2: Get All Guru (Pakai Token)**

```
GET http://127.0.0.1:8000/api/gurus

Headers:
Authorization: Bearer 3|xyz123abc456...
Accept: application/json

Response:
{
    "success": true,
    "data": [
        {
            "id": 1,
            "kode_guru": "GR001",
            "nama_guru": "Budi Santoso",
            ...
        }
    ]
}
```

---

### **Request 3: Get Jadwal by Kelas & Hari (Pakai Token)**

```
GET http://127.0.0.1:8000/api/jadwals/kelas/1/hari/Senin

Headers:
Authorization: Bearer 3|xyz123abc456...
Accept: application/json

Response:
{
    "success": true,
    "data": [
        {
            "id": 1,
            "jam_ke": "1-2",
            "mata_pelajaran": "Matematika",
            "kode_guru": "GR001",
            "nama_guru": "Budi Santoso"
        }
    ]
}
```

---

## 👥 Akun untuk Login (Sample Users)

Anda bisa login dengan salah satu akun berikut:

### **Admin (Akses Penuh):**
```json
{
    "email": "admin@sekolah.com",
    "password": "password"
}
```

### **Kurikulum:**
```json
{
    "email": "kurikulum@sekolah.com",
    "password": "password"
}
```

### **Kepala Sekolah:**
```json
{
    "email": "kepalasekolah@sekolah.com",
    "password": "password"
}
```

### **Siswa 1:**
```json
{
    "email": "siswa1@sekolah.com",
    "password": "password"
}
```

### **Siswa 2:**
```json
{
    "email": "siswa2@sekolah.com",
    "password": "password"
}
```

Semua password: `password`

---

## ❌ Error yang Sering Terjadi

### **Error 1: Unauthenticated**

```json
{
    "message": "Unauthenticated."
}
```

**Penyebab:**
- ❌ Tidak mengirim header `Authorization`
- ❌ Token salah atau typo
- ❌ Lupa kata `Bearer` sebelum token
- ❌ Token expired (sudah logout)

**Solusi:**
- ✅ Pastikan header: `Authorization: Bearer {token}`
- ✅ Ada spasi antara Bearer dan token
- ✅ Copy token dengan benar (tanpa spasi extra)
- ✅ Login ulang jika token expired

---

### **Error 2: Token Expired/Invalid**

**Penyebab:**
- Token sudah tidak valid (misal setelah logout)
- Token dari user yang sudah dihapus

**Solusi:**
- Login ulang untuk mendapat token baru

---

### **Error 3: Unable to connect to remote server**

**Penyebab:**
- Laravel server tidak berjalan

**Solusi:**
- Jalankan: `php artisan serve`

---

## 🔄 Lifecycle Token

```
1. User LOGIN → Server generate TOKEN
                    ↓
2. User simpan TOKEN di aplikasi
                    ↓
3. Setiap request → Kirim TOKEN di Header
                    ↓
4. Server validasi TOKEN
                    ↓
5. Jika valid → Response data ✅
   Jika invalid → Error 401 ❌
                    ↓
6. User LOGOUT → TOKEN dihapus dari server
                    ↓
7. TOKEN tidak bisa dipakai lagi ❌
```

---

## 💡 Tips & Best Practices

### **1. Simpan Token di Environment Variable (Postman)**

Lebih rapi dan mudah dikelola:

1. Klik icon ⚙️ (Settings) di kanan atas Postman
2. Klik **Environments**
3. Klik **+** untuk buat environment baru
4. Nama: `Monitoring Sekolah`
5. Tambahkan variable:
   - Variable: `base_url` | Value: `http://127.0.0.1:8000/api`
   - Variable: `token` | Value: `{paste_token_disini}`
6. Save

**Gunakan di request:**
- URL: `{{base_url}}/gurus`
- Header Authorization: `Bearer {{token}}`

Setiap kali login, cukup update value `token` di environment!

---

### **2. Buat Pre-request Script untuk Auto-login (Advanced)**

Tambahkan script di Collection level agar otomatis login jika token expired:

```javascript
// Pre-request Script
pm.sendRequest({
    url: 'http://127.0.0.1:8000/api/login',
    method: 'POST',
    header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: 'admin@sekolah.com',
            password: 'password'
        })
    }
}, function (err, res) {
    if (!err) {
        var jsonData = res.json();
        pm.environment.set("token", jsonData.token);
    }
});
```

---

### **3. Test Token Validity**

Setelah dapat token, test apakah token valid dengan request sederhana:

```
GET http://127.0.0.1:8000/api/user
Authorization: Bearer {your_token}
```

Response harus mengembalikan data user yang sedang login.

---

## 📱 Untuk Implementasi di Android

Setelah login, simpan token di SharedPreferences atau DataStore:

```kotlin
// Setelah login sukses
val token = response.token

// Simpan di SharedPreferences
val sharedPreferences = getSharedPreferences("auth", Context.MODE_PRIVATE)
sharedPreferences.edit().putString("token", token).apply()

// Gunakan di Retrofit Interceptor
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = sharedPreferences.getString("token", "")
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Accept", "application/json")
            .build()
        return chain.proceed(request)
    }
}
```

---

## ✅ Checklist

Pastikan Anda sudah:

- [ ] Laravel server running di `http://127.0.0.1:8000`
- [ ] Postman sudah ter-install
- [ ] Buat request POST ke `/api/login`
- [ ] Set Headers: `Content-Type` dan `Accept`
- [ ] Set Body dengan email dan password
- [ ] Klik Send
- [ ] **COPY TOKEN** dari response
- [ ] Gunakan token di header `Authorization: Bearer {token}`
- [ ] Test dengan request lain (misal GET `/api/gurus`)
- [ ] Berhasil dapat data ✅

---

## 🎬 Video Tutorial (Step by Step)

**Langkah di Postman:**

1. **New Request** → POST
2. URL: `http://127.0.0.1:8000/api/login`
3. Headers → Add:
   - `Content-Type: application/json`
   - `Accept: application/json`
4. Body → raw → JSON:
   ```json
   {
       "email": "admin@sekolah.com",
       "password": "password"
   }
   ```
5. **Send** → Lihat response
6. **Copy token** dari field `"token"`
7. **New Request** → GET
8. URL: `http://127.0.0.1:8000/api/gurus`
9. Headers → Add:
   - `Authorization: Bearer {paste_token_disini}`
   - `Accept: application/json`
10. **Send** → Lihat data guru ✅

---

## 📚 Dokumentasi Terkait

- `API_ENDPOINTS_DOCUMENTATION.md` - Semua endpoint lengkap
- `POSTMAN_TESTING_GUIDE.md` - Panduan testing
- `CUSTOM_JADWAL_ENDPOINTS.md` - Endpoint jadwal khusus

---

**Selamat mencoba!** 🚀

Jika masih ada error, pastikan:
1. Server Laravel running
2. Token di-copy dengan benar (tanpa spasi extra)
3. Format header: `Authorization: Bearer {token}` (ada spasi setelah Bearer)
