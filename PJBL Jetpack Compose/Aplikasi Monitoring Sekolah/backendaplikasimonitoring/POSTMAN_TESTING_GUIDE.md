# Quick Reference - API Endpoints untuk Postman Testing

Base URL: `http://127.0.0.1:8000/api`

## 📋 Daftar Endpoint Lengkap

### 🔐 Authentication (No Token Required)
```
POST   /login          - Login dan dapatkan token
POST   /register       - Register user baru
```

### 👤 User (Token Required)
```
GET    /user           - Get current user info
POST   /logout         - Logout dan hapus token
```

### 👨‍🏫 Guru
```
GET    /gurus          - List semua guru
POST   /gurus          - Tambah guru baru
GET    /gurus/{id}     - Detail guru + jadwalnya
PUT    /gurus/{id}     - Update guru
DELETE /gurus/{id}     - Hapus guru
```

### 📚 Mapel (Mata Pelajaran)
```
GET    /mapels         - List semua mapel
POST   /mapels         - Tambah mapel baru
GET    /mapels/{id}    - Detail mapel + jadwalnya
PUT    /mapels/{id}    - Update mapel
DELETE /mapels/{id}    - Hapus mapel
```

### 📅 Tahun Ajaran
```
GET    /tahun-ajarans      - List semua tahun ajaran
POST   /tahun-ajarans      - Tambah tahun ajaran baru
GET    /tahun-ajarans/{id} - Detail tahun ajaran + jadwalnya
PUT    /tahun-ajarans/{id} - Update tahun ajaran
DELETE /tahun-ajarans/{id} - Hapus tahun ajaran
```

### 🏫 Kelas
```
GET    /kelas          - List semua kelas
POST   /kelas          - Tambah kelas baru
GET    /kelas/{id}     - Detail kelas + jadwalnya
PUT    /kelas/{id}     - Update kelas
DELETE /kelas/{id}     - Hapus kelas
```

### 📋 Jadwal
```
GET    /jadwals                            - List semua jadwal (with relations)
POST   /jadwals                            - Tambah jadwal baru
GET    /jadwals/{id}                       - Detail jadwal + guru mengajar
PUT    /jadwals/{id}                       - Update jadwal
DELETE /jadwals/{id}                       - Hapus jadwal

🆕 Custom Endpoints:
GET    /jadwals/kelas/{kelasId}/hari/{hari}  - Jadwal by Kelas & Hari (ringkas)
GET    /jadwals/hari/{hari}/kelas/{kelasId}  - Jadwal by Hari & Kelas (detail)
```

### ✅ Guru Mengajar
```
GET    /guru-mengajars         - List semua data guru mengajar
POST   /guru-mengajars         - Tambah data guru mengajar
GET    /guru-mengajars/{id}    - Detail guru mengajar
PUT    /guru-mengajars/{id}    - Update guru mengajar
DELETE /guru-mengajars/{id}    - Hapus guru mengajar
```

---

## 🚀 Testing Flow di Postman

**❓ Bingung cara dapat token?** 
👉 **Baca dulu:** `QUICK_START_TOKEN.md` atau `CARA_MENDAPATKAN_TOKEN.md`

### 1️⃣ Login dulu untuk dapat token
```http
POST http://127.0.0.1:8000/api/login
Content-Type: application/json

{
    "email": "admin@sekolah.com",
    "password": "password"
}
```

**Copy token dari response!**

**Response:**
```json
{
    "token": "3|AbCdEfGh...",
    "user": {...}
}
```

---

### 2️⃣ Set Authorization di semua request berikutnya
```
Headers:
Authorization: Bearer {your_token}
Accept: application/json
```

**⚠️ PENTING:** Harus ada spasi antara `Bearer` dan token!
Content-Type: application/json
```

---

### 3️⃣ Test CRUD Guru

**GET All Guru:**
```http
GET http://127.0.0.1:8000/api/gurus
```

**POST Create Guru:**
```http
POST http://127.0.0.1:8000/api/gurus
Content-Type: application/json

{
    "kode_guru": "GR006",
    "nama_guru": "Test Guru",
    "telepon": "081234567890"
}
```

**GET Single Guru:**
```http
GET http://127.0.0.1:8000/api/gurus/1
```

**PUT Update Guru:**
```http
PUT http://127.0.0.1:8000/api/gurus/6
Content-Type: application/json

{
    "nama_guru": "Test Guru Updated"
}
```

**DELETE Guru:**
```http
DELETE http://127.0.0.1:8000/api/gurus/6
```

---

### 4️⃣ Test CRUD Mapel

**GET All Mapel:**
```http
GET http://127.0.0.1:8000/api/mapels
```

**POST Create Mapel:**
```http
POST http://127.0.0.1:8000/api/mapels
Content-Type: application/json

{
    "kode_mapel": "FIS",
    "nama_mapel": "Fisika"
}
```

---

### 5️⃣ Test CRUD Tahun Ajaran

**GET All Tahun Ajaran:**
```http
GET http://127.0.0.1:8000/api/tahun-ajarans
```

**POST Create Tahun Ajaran:**
```http
POST http://127.0.0.1:8000/api/tahun-ajarans
Content-Type: application/json

{
    "tahun": "2026/2027",
    "flag": 0
}
```

---

### 6️⃣ Test CRUD Kelas

**GET All Kelas:**
```http
GET http://127.0.0.1:8000/api/kelas
```

**POST Create Kelas:**
```http
POST http://127.0.0.1:8000/api/kelas
Content-Type: application/json

{
    "nama_kelas": "10 IPA 3"
}
```

---

### 7️⃣ Test CRUD Jadwal

**GET All Jadwal (with relationships):**
```http
GET http://127.0.0.1:8000/api/jadwals
```

Response includes guru, mapel, tahun_ajaran, kelas objects!

**POST Create Jadwal:**
```http
POST http://127.0.0.1:8000/api/jadwals
Content-Type: application/json

{
    "guru_id": 1,
    "mapel_id": 1,
    "tahun_ajaran_id": 2,
    "kelas_id": 1,
    "jam_ke": "7-8",
    "hari": "Sabtu"
}
```

**GET Single Jadwal (with guru_mengajars):**
```http
GET http://127.0.0.1:8000/api/jadwals/1
```

**🆕 GET Jadwal by Kelas & Hari (Ringkas):**
```http
GET http://127.0.0.1:8000/api/jadwals/kelas/1/hari/Senin
```
Response: jam_ke, mata_pelajaran, kode_guru, nama_guru

**🆕 GET Jadwal by Hari & Kelas (Detail):**
```http
GET http://127.0.0.1:8000/api/jadwals/hari/Senin/kelas/1
```
Response: nama_guru, mapel, tahun_ajaran, jam_ke, kelas, hari

**Valid Hari:** Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

---

### 8️⃣ Test CRUD Guru Mengajar

**GET All Guru Mengajar:**
```http
GET http://127.0.0.1:8000/api/guru-mengajars
```

Response includes jadwal details with guru, mapel, kelas!

**POST Create Guru Mengajar:**
```http
POST http://127.0.0.1:8000/api/guru-mengajars
Content-Type: application/json

{
    "jadwal_id": 1,
    "keterangan": "Materi Trigonometri",
    "status": "masuk"
}
```

**PUT Update Status ke Tidak Masuk:**
```http
PUT http://127.0.0.1:8000/api/guru-mengajars/1
Content-Type: application/json

{
    "status": "tidak_masuk",
    "keterangan": "Guru sakit"
}
```

---

## 📊 Sample Data dari Seeder

### Users:
- admin@sekolah.com / password (role: admin)
- siswa1@sekolah.com / password (role: siswa)
- siswa2@sekolah.com / password (role: siswa)
- kurikulum@sekolah.com / password (role: kurikulum)
- kepalasekolah@sekolah.com / password (role: kepala_sekolah)

### Guru (5 data):
- GR001 - Budi Santoso
- GR002 - Siti Nurhaliza
- GR003 - Ahmad Fauzi
- GR004 - Dewi Lestari
- GR005 - Rudi Hermawan

### Mapel (7 data):
- MAT - Matematika
- IPA - Ilmu Pengetahuan Alam
- IPS - Ilmu Pengetahuan Sosial
- BIN - Bahasa Indonesia
- BING - Bahasa Inggris
- PJOK - Pendidikan Jasmani
- SBK - Seni Budaya

### Tahun Ajaran (3 data):
- 2023/2024 (flag: 0)
- 2024/2025 (flag: 1) ← aktif
- 2025/2026 (flag: 0)

### Kelas (8 data):
- 10 IPA 1, 10 IPA 2, 10 IPS 1
- 11 IPA 1, 11 IPA 2, 11 IPS 1
- 12 IPA 1, 12 IPS 1

### Jadwal (10 data):
Senin-Jumat, berbagai kombinasi guru-mapel-kelas

### Guru Mengajar (7 data):
Mix status masuk dan tidak_masuk

---

## ✅ Expected Response Format

### Success Response:
```json
{
    "success": true,
    "data": {...}
}
```

### Success with Message:
```json
{
    "success": true,
    "message": "Data berhasil ditambahkan",
    "data": {...}
}
```

### Error 401 (Unauthorized):
```json
{
    "message": "Unauthenticated."
}
```

### Error 422 (Validation):
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "field_name": ["Error message"]
    }
}
```

### Error 404 (Not Found):
```json
{
    "message": "No query results for model..."
}
```

---

## 🎯 Tips Testing:

1. **Always login first** to get fresh token
2. **Test GET all** before testing specific resource
3. **Create data** before testing update/delete
4. **Check IDs** - use actual IDs from GET responses
5. **Relationships** - jadwals and guru-mengajars return nested data
6. **Validation** - test with invalid data to see error messages
7. **Status enum** - guru_mengajar status: "masuk" or "tidak_masuk"
8. **Hari enum** - jadwal hari: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

---

## 🔧 Troubleshooting:

**401 Unauthenticated?**
- Login ulang untuk dapat token baru
- Pastikan header Authorization: Bearer {token}

**404 Not Found?**
- Cek ID yang digunakan, mungkin sudah dihapus
- Run GET all dulu untuk lihat ID yang available

**422 Validation Error?**
- Cek required fields di documentation
- Pastikan format data sesuai (enum values, foreign keys exist)

**Server not responding?**
- Pastikan Laravel server running: `php artisan serve`
- Check console untuk error messages

---

📁 **Full Documentation:** Lihat `API_ENDPOINTS_DOCUMENTATION.md` untuk detail lengkap!
