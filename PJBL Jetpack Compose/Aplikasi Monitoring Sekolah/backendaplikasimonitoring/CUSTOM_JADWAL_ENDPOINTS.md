# Custom Jadwal Endpoints - Quick Reference

## 🆕 Fungsi Baru di JadwalController

### 1️⃣ Get Jadwal by Kelas ID dan Hari (Ringkas)

**Endpoint:** `GET /api/jadwals/kelas/{kelasId}/hari/{hari}`

**Fungsi:** Menampilkan jadwal pelajaran untuk kelas tertentu pada hari tertentu dalam format ringkas

**Response Format:**
- `jam_ke` - Jam pelajaran (contoh: "1-2", "3-4")
- `mata_pelajaran` - Nama mata pelajaran
- `kode_guru` - Kode guru yang mengajar
- `nama_guru` - Nama lengkap guru

**Contoh Request:**
```http
GET http://127.0.0.1:8000/api/jadwals/kelas/1/hari/Senin
Authorization: Bearer {your_token}
Accept: application/json
```

**Contoh Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "jam_ke": "1-2",
            "mata_pelajaran": "Matematika",
            "kode_guru": "GR001",
            "nama_guru": "Budi Santoso"
        },
        {
            "id": 2,
            "jam_ke": "3-4",
            "mata_pelajaran": "Ilmu Pengetahuan Alam",
            "kode_guru": "GR002",
            "nama_guru": "Siti Nurhaliza"
        },
        {
            "id": 3,
            "jam_ke": "5-6",
            "mata_pelajaran": "Bahasa Indonesia",
            "kode_guru": "GR003",
            "nama_guru": "Ahmad Fauzi"
        }
    ]
}
```

**Response jika tidak ada data (404):**
```json
{
    "success": false,
    "message": "Tidak ada jadwal ditemukan untuk kelas dan hari tersebut"
}
```

**Valid Hari:** Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

**Use Case:**
- Menampilkan jadwal harian di aplikasi mobile untuk siswa
- Melihat siapa guru yang mengajar hari ini
- UI yang lebih sederhana dan fokus pada informasi penting

---

### 2️⃣ Get Jadwal Detail by Hari dan Kelas ID (Lengkap)

**Endpoint:** `GET /api/jadwals/hari/{hari}/kelas/{kelasId}`

**Fungsi:** Menampilkan jadwal pelajaran lengkap dengan detail tahun ajaran untuk kelas tertentu pada hari tertentu

**Response Format:**
- `nama_guru` - Nama lengkap guru
- `mapel` - Nama mata pelajaran
- `tahun_ajaran` - Tahun ajaran (contoh: "2024/2025")
- `jam_ke` - Jam pelajaran
- `kelas` - Nama kelas
- `hari` - Hari

**Contoh Request:**
```http
GET http://127.0.0.1:8000/api/jadwals/hari/Senin/kelas/1
Authorization: Bearer {your_token}
Accept: application/json
```

**Contoh Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nama_guru": "Budi Santoso",
            "mapel": "Matematika",
            "tahun_ajaran": "2024/2025",
            "jam_ke": "1-2",
            "kelas": "10 IPA 1",
            "hari": "Senin"
        },
        {
            "id": 2,
            "nama_guru": "Siti Nurhaliza",
            "mapel": "Ilmu Pengetahuan Alam",
            "tahun_ajaran": "2024/2025",
            "jam_ke": "3-4",
            "kelas": "10 IPA 1",
            "hari": "Senin"
        },
        {
            "id": 3,
            "nama_guru": "Ahmad Fauzi",
            "mapel": "Bahasa Indonesia",
            "tahun_ajaran": "2024/2025",
            "jam_ke": "5-6",
            "kelas": "10 IPA 1",
            "hari": "Senin"
        }
    ]
}
```

**Response jika tidak ada data (404):**
```json
{
    "success": false,
    "message": "Tidak ada jadwal ditemukan untuk hari dan kelas tersebut"
}
```

**Valid Hari:** Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

**Use Case:**
- Export data jadwal untuk laporan
- Menampilkan informasi lengkap termasuk tahun ajaran
- Verifikasi data jadwal oleh admin/kurikulum

---

## 🔍 Perbedaan Kedua Endpoint

| Aspek | Endpoint 1 (kelas/hari) | Endpoint 2 (hari/kelas) |
|-------|------------------------|-------------------------|
| **URL Pattern** | `/kelas/{id}/hari/{hari}` | `/hari/{hari}/kelas/{id}` |
| **Output** | Ringkas (4 field) | Lengkap (7 field) |
| **Kode Guru** | ✅ Tampil | ❌ Tidak tampil |
| **Tahun Ajaran** | ❌ Tidak tampil | ✅ Tampil |
| **Nama Kelas** | ❌ Tidak tampil | ✅ Tampil |
| **Use Case** | UI Mobile, Quick View | Laporan, Detail View |

---

## 📋 Testing di Postman

### Test Endpoint 1 (Ringkas):

**Step 1 - Login:**
```http
POST http://127.0.0.1:8000/api/login
Content-Type: application/json

{
    "email": "admin@sekolah.com",
    "password": "password"
}
```

**Step 2 - Copy Token**

**Step 3 - Test Jadwal Kelas 1 Hari Senin:**
```http
GET http://127.0.0.1:8000/api/jadwals/kelas/1/hari/Senin
Authorization: Bearer {your_token}
Accept: application/json
```

**Step 4 - Test dengan kelas dan hari berbeda:**
```http
GET http://127.0.0.1:8000/api/jadwals/kelas/2/hari/Rabu
GET http://127.0.0.1:8000/api/jadwals/kelas/4/hari/Kamis
GET http://127.0.0.1:8000/api/jadwals/kelas/7/hari/Jumat
```

---

### Test Endpoint 2 (Detail):

**Test Jadwal Hari Senin Kelas 1:**
```http
GET http://127.0.0.1:8000/api/jadwals/hari/Senin/kelas/1
Authorization: Bearer {your_token}
Accept: application/json
```

**Test dengan hari dan kelas berbeda:**
```http
GET http://127.0.0.1:8000/api/jadwals/hari/Selasa/kelas/1
GET http://127.0.0.1:8000/api/jadwals/hari/Rabu/kelas/2
GET http://127.0.0.1:8000/api/jadwals/hari/Kamis/kelas/4
```

---

## 🎯 Sample Data untuk Testing

Berdasarkan seeder yang sudah dibuat:

### Kelas yang tersedia:
- ID 1: 10 IPA 1
- ID 2: 10 IPA 2
- ID 3: 10 IPS 1
- ID 4: 11 IPA 1
- ID 5: 11 IPA 2
- ID 6: 11 IPS 1
- ID 7: 12 IPA 1
- ID 8: 12 IPS 1

### Hari yang valid:
- Senin
- Selasa
- Rabu
- Kamis
- Jumat
- Sabtu

### Jadwal tersedia (dari seeder):
- **Senin, Kelas 1 (10 IPA 1)**: 3 jadwal (Matematika, IPA, Bahasa Indonesia)
- **Selasa, Kelas 1 (10 IPA 1)**: 2 jadwal (Bahasa Inggris, PJOK)
- **Rabu, Kelas 2 (10 IPA 2)**: 2 jadwal (Matematika, IPA)
- **Kamis, Kelas 4 (11 IPA 1)**: 2 jadwal (IPS, Bahasa Indonesia)
- **Jumat, Kelas 7 (12 IPA 1)**: 1 jadwal (SBK)

---

## ⚠️ Error Handling

### Error 404 - Tidak Ada Jadwal:
```http
GET http://127.0.0.1:8000/api/jadwals/kelas/1/hari/Minggu
```
Response:
```json
{
    "success": false,
    "message": "Tidak ada jadwal ditemukan untuk kelas dan hari tersebut"
}
```

### Error 401 - Unauthorized:
Jika tidak mengirim token atau token expired:
```json
{
    "message": "Unauthenticated."
}
```

### Error 404 - Route Not Found:
Jika typo nama hari atau format salah:
```json
{
    "message": "The route ... could not be found."
}
```

---

## 💡 Tips Implementasi di Android

### Untuk Endpoint 1 (Ringkas):
```kotlin
// GET /api/jadwals/kelas/{kelasId}/hari/{hari}
@GET("jadwals/kelas/{kelasId}/hari/{hari}")
suspend fun getJadwalByKelasAndHari(
    @Path("kelasId") kelasId: Int,
    @Path("hari") hari: String
): Response<JadwalRingkasResponse>
```

**Response Data Class:**
```kotlin
data class JadwalRingkasResponse(
    val success: Boolean,
    val data: List<JadwalRingkas>
)

data class JadwalRingkas(
    val id: Int,
    val jam_ke: String,
    val mata_pelajaran: String,
    val kode_guru: String,
    val nama_guru: String
)
```

### Untuk Endpoint 2 (Detail):
```kotlin
// GET /api/jadwals/hari/{hari}/kelas/{kelasId}
@GET("jadwals/hari/{hari}/kelas/{kelasId}")
suspend fun getJadwalDetailByHariAndKelas(
    @Path("hari") hari: String,
    @Path("kelasId") kelasId: Int
): Response<JadwalDetailResponse>
```

**Response Data Class:**
```kotlin
data class JadwalDetailResponse(
    val success: Boolean,
    val data: List<JadwalDetail>
)

data class JadwalDetail(
    val id: Int,
    val nama_guru: String,
    val mapel: String,
    val tahun_ajaran: String,
    val jam_ke: String,
    val kelas: String,
    val hari: String
)
```

---

## ✅ Checklist Testing

- [ ] Login dan dapatkan token
- [ ] Test endpoint 1 dengan kelas 1 hari Senin (ada data)
- [ ] Test endpoint 1 dengan kelas 1 hari Minggu (tidak ada data)
- [ ] Test endpoint 2 dengan hari Senin kelas 1 (ada data)
- [ ] Test endpoint 2 dengan hari Minggu kelas 1 (tidak ada data)
- [ ] Verify response format sesuai dokumentasi
- [ ] Test dengan berbagai kombinasi kelas dan hari
- [ ] Test error handling (401, 404)

---

📁 **Dokumentasi Lengkap:** Lihat `API_ENDPOINTS_DOCUMENTATION.md` untuk semua endpoint!
