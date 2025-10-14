# Custom Guru Mengajar Endpoints Documentation

## 📋 Daftar Isi
1. [Overview](#overview)
2. [Endpoint 1: POST Guru Mengajar by Jadwal Params](#1-post-guru-mengajar-by-jadwal-params)
3. [Endpoint 2: PUT Guru Mengajar by Jadwal Params](#2-put-guru-mengajar-by-jadwal-params)
4. [Endpoint 3: GET Guru Mengajar by Hari dan Kelas](#3-get-guru-mengajar-by-hari-dan-kelas)
5. [Endpoint 4: GET Guru Tidak Masuk by Hari dan Kelas](#4-get-guru-tidak-masuk-by-hari-dan-kelas)
6. [Testing dengan Postman](#testing-dengan-postman)
7. [Error Handling](#error-handling)

---

## Overview

Custom endpoints ini dibuat untuk memudahkan penggunaan API Guru Mengajar dari aplikasi mobile. 

**Perbedaan dengan CRUD Standar:**
- **CRUD Standar**: Membutuhkan `jadwal_id` yang sudah diketahui
- **Custom Endpoints**: Cukup kirim parameter jadwal (hari, kelas, guru, mapel, jam_ke), sistem akan mencari `jadwal_id` secara otomatis

**Keuntungan:**
- ✅ Lebih intuitif untuk penggunaan mobile app
- ✅ Mengurangi jumlah API call yang diperlukan
- ✅ Tidak perlu query jadwal terlebih dahulu untuk mendapat ID
- ✅ Response langsung menyertakan data relasi (nama guru, mapel, dll)

---

## 1. POST Guru Mengajar by Jadwal Params

**Endpoint:** `POST /api/guru-mengajars/by-jadwal`

**Deskripsi:** Membuat data guru mengajar baru dengan mencari jadwal berdasarkan parameter lengkap, bukan dengan jadwal_id langsung.

**Authentication:** Bearer Token (required)

### Request Body

```json
{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 2,
    "mapel_id": 3,
    "jam_ke": "1",
    "status": "masuk",
    "keterangan": "Mengajar sesuai jadwal"
}
```

### Request Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| hari | string | ✅ Yes | Hari jadwal | `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu` |
| kelas_id | integer | ✅ Yes | ID kelas | Must exist in `kelas` table |
| guru_id | integer | ✅ Yes | ID guru | Must exist in `gurus` table |
| mapel_id | integer | ✅ Yes | ID mata pelajaran | Must exist in `mapels` table |
| jam_ke | string | ✅ Yes | Jam ke berapa | Any string |
| status | string | ✅ Yes | Status kehadiran guru | `masuk` atau `tidak_masuk` |
| keterangan | string | ❌ No | Keterangan tambahan | Optional, nullable |

### Response Success (201 Created)

```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil ditambahkan",
    "data": {
        "id": 8,
        "jadwal_id": 5,
        "status": "masuk",
        "keterangan": "Mengajar sesuai jadwal",
        "created_at": "2025-01-12T10:30:00.000000Z",
        "updated_at": "2025-01-12T10:30:00.000000Z",
        "jadwal": {
            "id": 5,
            "guru_id": 2,
            "mapel_id": 3,
            "tahun_ajaran_id": 1,
            "kelas_id": 1,
            "jam_ke": "1",
            "hari": "Senin",
            "guru": {
                "id": 2,
                "kode_guru": "G002",
                "nama_guru": "Siti Nurhaliza, S.Pd",
                "telepon": "081234567891"
            },
            "mapel": {
                "id": 3,
                "kode_mapel": "M003",
                "nama_mapel": "Matematika"
            },
            "kelas": {
                "id": 1,
                "nama_kelas": "X IPA 1"
            }
        }
    }
}
```

### Response Error - Jadwal Tidak Ditemukan (404 Not Found)

```json
{
    "success": false,
    "message": "Jadwal tidak ditemukan dengan parameter tersebut"
}
```

### Response Error - Validation Failed (422 Unprocessable Entity)

```json
{
    "message": "The hari field is required. (and 2 more errors)",
    "errors": {
        "hari": [
            "The hari field is required."
        ],
        "status": [
            "The selected status is invalid."
        ],
        "guru_id": [
            "The selected guru id is invalid."
        ]
    }
}
```

### Contoh cURL

```bash
curl -X POST "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 2,
    "mapel_id": 3,
    "jam_ke": "1",
    "status": "masuk",
    "keterangan": "Mengajar sesuai jadwal"
  }'
```

---

## 2. PUT Guru Mengajar by Jadwal Params

**Endpoint:** `PUT /api/guru-mengajars/by-jadwal`

**Deskripsi:** Update data guru mengajar (khusus **status** dan **keterangan**) dengan mencari jadwal berdasarkan parameter. Jika data belum ada, akan dibuat otomatis.

**Authentication:** Bearer Token (required)

### Request Body

```json
{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 2,
    "mapel_id": 3,
    "jam_ke": "1",
    "status": "tidak_masuk",
    "keterangan": "Sakit"
}
```

### Request Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| hari | string | ✅ Yes | Hari jadwal | `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu` |
| kelas_id | integer | ✅ Yes | ID kelas | Must exist in `kelas` table |
| guru_id | integer | ✅ Yes | ID guru | Must exist in `gurus` table |
| mapel_id | integer | ✅ Yes | ID mata pelajaran | Must exist in `mapels` table |
| jam_ke | string | ✅ Yes | Jam ke berapa | Any string |
| status | string | ✅ Yes | Status kehadiran guru | `masuk` atau `tidak_masuk` |
| keterangan | string | ❌ No | Keterangan tambahan | Optional, nullable |

### Response Success - Update Existing (200 OK)

```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil diupdate",
    "data": {
        "id": 8,
        "jadwal_id": 5,
        "status": "tidak_masuk",
        "keterangan": "Sakit",
        "created_at": "2025-01-12T10:30:00.000000Z",
        "updated_at": "2025-01-12T11:00:00.000000Z",
        "jadwal": {
            "id": 5,
            "guru_id": 2,
            "mapel_id": 3,
            "tahun_ajaran_id": 1,
            "kelas_id": 1,
            "jam_ke": "1",
            "hari": "Senin",
            "guru": {
                "id": 2,
                "kode_guru": "G002",
                "nama_guru": "Siti Nurhaliza, S.Pd",
                "telepon": "081234567891"
            },
            "mapel": {
                "id": 3,
                "kode_mapel": "M003",
                "nama_mapel": "Matematika"
            },
            "kelas": {
                "id": 1,
                "nama_kelas": "X IPA 1"
            }
        }
    }
}
```

### Response Success - Create New (200 OK)

```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil ditambahkan",
    "data": {
        "id": 9,
        "jadwal_id": 5,
        "status": "tidak_masuk",
        "keterangan": "Sakit",
        "created_at": "2025-01-12T11:00:00.000000Z",
        "updated_at": "2025-01-12T11:00:00.000000Z",
        "jadwal": {
            // ... data jadwal dengan relasi
        }
    }
}
```

### Response Error - Jadwal Tidak Ditemukan (404 Not Found)

```json
{
    "success": false,
    "message": "Jadwal tidak ditemukan dengan parameter tersebut"
}
```

### Contoh cURL

```bash
curl -X PUT "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 2,
    "mapel_id": 3,
    "jam_ke": "1",
    "status": "tidak_masuk",
    "keterangan": "Sakit"
  }'
```

### Catatan Penting

⚠️ **Yang Di-update Hanya Status dan Keterangan**
- Endpoint ini hanya mengubah field `status` dan `keterangan`
- Jika ingin mengubah jadwal lain (hari, jam, guru, dll), gunakan endpoint POST baru dengan parameter jadwal yang berbeda

---

## 3. GET Guru Mengajar by Hari dan Kelas

**Endpoint:** `GET /api/guru-mengajars/hari/{hari}/kelas/{kelasId}`

**Deskripsi:** Menampilkan daftar guru mengajar berdasarkan hari dan kelas tertentu. Menampilkan id, nama guru, mapel, jam ke, status, dan keterangan.

**Authentication:** Bearer Token (required)

### URL Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| hari | string | ✅ Yes | Hari jadwal | `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu` |
| kelasId | integer | ✅ Yes | ID kelas | `1`, `2`, `3`, etc. |

### Request Example

```
GET /api/guru-mengajars/hari/Senin/kelas/1
```

### Response Success (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nama_guru": "Siti Nurhaliza, S.Pd",
            "mapel": "Matematika",
            "jam_ke": "1",
            "status": "masuk",
            "keterangan": "Mengajar sesuai jadwal"
        },
        {
            "id": 2,
            "nama_guru": "Budi Santoso, S.Kom",
            "mapel": "Pemrograman Web",
            "jam_ke": "2",
            "status": "tidak_masuk",
            "keterangan": "Sakit"
        },
        {
            "id": 3,
            "nama_guru": "Ahmad Yani, M.Pd",
            "mapel": "Bahasa Indonesia",
            "jam_ke": "3",
            "status": "masuk",
            "keterangan": null
        }
    ]
}
```

### Response Error - Data Tidak Ditemukan (404 Not Found)

```json
{
    "success": false,
    "message": "Tidak ada data guru mengajar untuk hari dan kelas tersebut"
}
```

### Contoh cURL

```bash
curl -X GET "http://127.0.0.1:8000/api/guru-mengajars/hari/Senin/kelas/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Response Fields Explanation

| Field | Type | Description |
|-------|------|-------------|
| id | integer | ID guru mengajar (primary key) |
| nama_guru | string | Nama lengkap guru dari tabel gurus |
| mapel | string | Nama mata pelajaran dari tabel mapels |
| jam_ke | string | Jam ke berapa dari jadwal |
| status | string | Status kehadiran: `masuk` atau `tidak_masuk` |
| keterangan | string/null | Keterangan tambahan (nullable) |

---

## 4. GET Guru Tidak Masuk by Hari dan Kelas

**Endpoint:** `GET /api/guru-mengajars/tidak-masuk/hari/{hari}/kelas/{kelasId}`

**Deskripsi:** Menampilkan daftar guru yang **tidak masuk** (status = `tidak_masuk`) berdasarkan hari dan kelas tertentu. Berguna untuk monitoring guru yang absen.

**Authentication:** Bearer Token (required)

### URL Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| hari | string | ✅ Yes | Hari jadwal | `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu` |
| kelasId | integer | ✅ Yes | ID kelas | `1`, `2`, `3`, etc. |

### Request Example

```
GET /api/guru-mengajars/tidak-masuk/hari/Senin/kelas/1
```

### Response Success (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": 2,
            "nama_guru": "Budi Santoso, S.Kom",
            "mapel": "Pemrograman Web",
            "jam_ke": "2",
            "status": "tidak_masuk",
            "keterangan": "Sakit"
        },
        {
            "id": 5,
            "nama_guru": "Dewi Lestari, S.S",
            "mapel": "Bahasa Inggris",
            "jam_ke": "5",
            "status": "tidak_masuk",
            "keterangan": "Izin urusan keluarga"
        }
    ]
}
```

### Response Error - Data Tidak Ditemukan (404 Not Found)

```json
{
    "success": false,
    "message": "Tidak ada guru yang tidak masuk untuk hari dan kelas tersebut"
}
```

### Contoh cURL

```bash
curl -X GET "http://127.0.0.1:8000/api/guru-mengajars/tidak-masuk/hari/Senin/kelas/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Response Fields Explanation

| Field | Type | Description |
|-------|------|-------------|
| id | integer | ID guru mengajar (primary key) |
| nama_guru | string | Nama lengkap guru dari tabel gurus |
| mapel | string | Nama mata pelajaran dari tabel mapels |
| jam_ke | string | Jam ke berapa dari jadwal |
| status | string | Selalu `tidak_masuk` (filtered) |
| keterangan | string/null | Alasan tidak masuk (nullable) |

### Use Case

Endpoint ini sangat berguna untuk:
- 📊 **Dashboard monitoring** - Melihat guru yang absen hari ini
- 📱 **Notifikasi** - Mengirim alert ke admin/kepala sekolah
- 📝 **Laporan absensi** - Generate laporan guru tidak masuk
- 🔄 **Penggantian guru** - Mencari guru pengganti untuk kelas yang kosong

---

## Testing dengan Postman

### Step 1: Setup Environment

1. Buat environment baru di Postman
2. Tambahkan variable:
   - `base_url` = `http://127.0.0.1:8000/api`
   - `token` = (dapatkan dari login endpoint)

### Step 2: Get Token

Gunakan endpoint login untuk mendapatkan token:

```
POST {{base_url}}/login
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "password"
}
```

Copy token dari response dan simpan di environment variable `token`.

Referensi lengkap: `QUICK_START_TOKEN.md` atau `CARA_MENDAPATKAN_TOKEN.md`

### Step 3: Test POST by Jadwal Params

```
POST {{base_url}}/guru-mengajars/by-jadwal
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 2,
    "mapel_id": 3,
    "jam_ke": "1",
    "status": "masuk",
    "keterangan": "Mengajar sesuai jadwal"
}
```

**Expected Result:** Status 201, data guru mengajar baru dengan relasi

### Step 4: Test PUT by Jadwal Params

```
PUT {{base_url}}/guru-mengajars/by-jadwal
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 2,
    "mapel_id": 3,
    "jam_ke": "1",
    "status": "tidak_masuk",
    "keterangan": "Sakit"
}
```

**Expected Result:** Status 200, data guru mengajar ter-update (status dan keterangan berubah)

### Step 5: Test GET by Hari dan Kelas

```
GET {{base_url}}/guru-mengajars/hari/Senin/kelas/1
Authorization: Bearer {{token}}
```

**Expected Result:** Status 200, array of guru mengajar untuk Senin kelas X IPA 1

### Step 6: Test GET Tidak Masuk

```
GET {{base_url}}/guru-mengajars/tidak-masuk/hari/Senin/kelas/1
Authorization: Bearer {{token}}
```

**Expected Result:** Status 200, array of guru yang tidak masuk untuk Senin kelas X IPA 1

---

## Error Handling

### 1. Authentication Error (401 Unauthorized)

**Penyebab:**
- Token tidak disertakan
- Token expired
- Token tidak valid

**Response:**
```json
{
    "message": "Unauthenticated."
}
```

**Solusi:** 
- Pastikan header `Authorization: Bearer YOUR_TOKEN` ada
- Login ulang untuk mendapatkan token baru

### 2. Validation Error (422 Unprocessable Entity)

**Penyebab:**
- Field required tidak diisi
- Format data salah
- ID tidak ditemukan di database

**Response:**
```json
{
    "message": "The hari field is required. (and 2 more errors)",
    "errors": {
        "hari": ["The hari field is required."],
        "status": ["The selected status is invalid."],
        "kelas_id": ["The selected kelas id is invalid."]
    }
}
```

**Solusi:**
- Periksa semua field required
- Pastikan enum value benar (`masuk`/`tidak_masuk` untuk status, `Senin`-`Sabtu` untuk hari)
- Pastikan ID kelas, guru, mapel ada di database

### 3. Jadwal Not Found (404 Not Found)

**Penyebab:**
- Kombinasi hari, kelas_id, guru_id, mapel_id, jam_ke tidak ditemukan di tabel jadwal
- Jadwal belum dibuat untuk parameter tersebut

**Response:**
```json
{
    "success": false,
    "message": "Jadwal tidak ditemukan dengan parameter tersebut"
}
```

**Solusi:**
- Periksa apakah jadwal sudah ada dengan endpoint `GET /api/jadwals`
- Cek kombinasi parameter yang dikirim
- Buat jadwal terlebih dahulu jika belum ada

### 4. No Data Found (404 Not Found)

**Penyebab:**
- Belum ada data guru mengajar untuk hari dan kelas tersebut
- Tidak ada guru yang tidak masuk (untuk endpoint tidak-masuk)

**Response:**
```json
{
    "success": false,
    "message": "Tidak ada data guru mengajar untuk hari dan kelas tersebut"
}
```

**Solusi:**
- Normal jika memang belum ada data
- Pastikan sudah input data guru mengajar terlebih dahulu

### 5. Server Error (500 Internal Server Error)

**Penyebab:**
- Error pada server Laravel
- Database connection issue
- Bug pada kode

**Response:**
```json
{
    "message": "Server Error",
    "exception": "...",
    "file": "...",
    "line": ...
}
```

**Solusi:**
- Cek log Laravel di `storage/logs/laravel.log`
- Pastikan database connection berfungsi
- Hubungi developer jika error persist

---

## Perbandingan: Custom vs CRUD Standar

### Scenario: Input Guru Tidak Masuk

#### ❌ Cara Lama (CRUD Standar)

```javascript
// Step 1: Cari jadwal_id terlebih dahulu
const jadwalResponse = await fetch('/api/jadwals', {
    headers: { 'Authorization': 'Bearer ' + token }
});
const jadwals = await jadwalResponse.json();

// Step 2: Filter manual untuk dapat jadwal_id
const jadwal = jadwals.data.find(j => 
    j.hari === 'Senin' && 
    j.kelas_id === 1 && 
    j.guru_id === 2 && 
    j.mapel_id === 3 && 
    j.jam_ke === '1'
);

// Step 3: Baru bisa POST guru mengajar
const response = await fetch('/api/guru-mengajars', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        jadwal_id: jadwal.id,  // Harus ada jadwal_id
        status: 'tidak_masuk',
        keterangan: 'Sakit'
    })
});
```

**Total API Calls:** 2 (GET jadwals + POST guru-mengajars)

#### ✅ Cara Baru (Custom Endpoint)

```javascript
// Langsung POST dengan parameter jadwal
const response = await fetch('/api/guru-mengajars/by-jadwal', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        hari: 'Senin',
        kelas_id: 1,
        guru_id: 2,
        mapel_id: 3,
        jam_ke: '1',
        status: 'tidak_masuk',
        keterangan: 'Sakit'
    })
});
```

**Total API Calls:** 1 (POST by-jadwal)

**Keuntungan:**
- 🚀 Lebih cepat (1 API call vs 2)
- 💡 Lebih intuitif
- 📱 Lebih mudah diimplementasi di mobile app
- 🔍 Backend yang handle query jadwal

---

## Tips Implementasi di Android (Jetpack Compose)

### 1. Buat Data Class untuk Request

```kotlin
data class GuruMengajarByJadwalRequest(
    val hari: String,
    val kelas_id: Int,
    val guru_id: Int,
    val mapel_id: Int,
    val jam_ke: String,
    val status: String, // "masuk" atau "tidak_masuk"
    val keterangan: String? = null
)
```

### 2. Buat Retrofit Service

```kotlin
interface GuruMengajarService {
    @POST("guru-mengajars/by-jadwal")
    suspend fun createByJadwal(
        @Header("Authorization") token: String,
        @Body request: GuruMengajarByJadwalRequest
    ): Response<GuruMengajarResponse>
    
    @PUT("guru-mengajars/by-jadwal")
    suspend fun updateByJadwal(
        @Header("Authorization") token: String,
        @Body request: GuruMengajarByJadwalRequest
    ): Response<GuruMengajarResponse>
    
    @GET("guru-mengajars/hari/{hari}/kelas/{kelasId}")
    suspend fun getByHariAndKelas(
        @Header("Authorization") token: String,
        @Path("hari") hari: String,
        @Path("kelasId") kelasId: Int
    ): Response<GuruMengajarListResponse>
    
    @GET("guru-mengajars/tidak-masuk/hari/{hari}/kelas/{kelasId}")
    suspend fun getGuruTidakMasuk(
        @Header("Authorization") token: String,
        @Path("hari") hari: String,
        @Path("kelasId") kelasId: Int
    ): Response<GuruMengajarListResponse>
}
```

### 3. Implementasi Repository

```kotlin
class GuruMengajarRepository(private val service: GuruMengajarService) {
    
    suspend fun inputKehadiran(
        token: String,
        hari: String,
        kelasId: Int,
        guruId: Int,
        mapelId: Int,
        jamKe: String,
        status: String,
        keterangan: String? = null
    ): Result<GuruMengajar> = try {
        val request = GuruMengajarByJadwalRequest(
            hari = hari,
            kelas_id = kelasId,
            guru_id = guruId,
            mapel_id = mapelId,
            jam_ke = jamKe,
            status = status,
            keterangan = keterangan
        )
        
        val response = service.createByJadwal("Bearer $token", request)
        
        if (response.isSuccessful && response.body()?.success == true) {
            Result.success(response.body()!!.data)
        } else {
            Result.failure(Exception(response.body()?.message ?: "Error"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
    
    suspend fun getGuruTidakMasuk(
        token: String,
        hari: String,
        kelasId: Int
    ): Result<List<GuruMengajarSimple>> = try {
        val response = service.getGuruTidakMasuk("Bearer $token", hari, kelasId)
        
        if (response.isSuccessful && response.body()?.success == true) {
            Result.success(response.body()!!.data)
        } else {
            Result.failure(Exception(response.body()?.message ?: "Error"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### 4. Usage di ViewModel

```kotlin
class GuruMengajarViewModel(
    private val repository: GuruMengajarRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState
    
    fun inputKehadiran(
        hari: String,
        kelasId: Int,
        guruId: Int,
        mapelId: Int,
        jamKe: String,
        status: String,
        keterangan: String?
    ) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            
            val token = getToken() // Get from DataStore/SharedPreferences
            val result = repository.inputKehadiran(
                token, hari, kelasId, guruId, mapelId, jamKe, status, keterangan
            )
            
            _uiState.value = if (result.isSuccess) {
                UiState.Success(result.getOrNull()!!)
            } else {
                UiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
    
    fun loadGuruTidakMasuk(hari: String, kelasId: Int) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            
            val token = getToken()
            val result = repository.getGuruTidakMasuk(token, hari, kelasId)
            
            _uiState.value = if (result.isSuccess) {
                UiState.SuccessList(result.getOrNull()!!)
            } else {
                UiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}
```

---

## Checklist Testing

Gunakan checklist ini untuk memastikan semua endpoint berfungsi:

### ✅ POST by Jadwal Params
- [ ] Berhasil create dengan data lengkap
- [ ] Return 404 jika jadwal tidak ditemukan
- [ ] Return 422 jika validation gagal (hari invalid)
- [ ] Return 422 jika validation gagal (status invalid)
- [ ] Return 422 jika validation gagal (kelas_id tidak ada)
- [ ] Return 401 jika token tidak valid

### ✅ PUT by Jadwal Params
- [ ] Berhasil update data yang sudah ada
- [ ] Berhasil create data baru jika belum ada
- [ ] Hanya update status dan keterangan (field lain tidak berubah)
- [ ] Return 404 jika jadwal tidak ditemukan
- [ ] Return 422 jika validation gagal

### ✅ GET by Hari dan Kelas
- [ ] Return data jika ada guru mengajar
- [ ] Return 404 jika tidak ada data
- [ ] Response sesuai format (id, nama_guru, mapel, jam_ke, status, keterangan)
- [ ] Menampilkan semua guru mengajar tanpa filter status

### ✅ GET Tidak Masuk
- [ ] Return hanya guru dengan status "tidak_masuk"
- [ ] Return 404 jika tidak ada guru tidak masuk
- [ ] Response sesuai format (id, nama_guru, mapel, jam_ke, status, keterangan)
- [ ] Tidak menampilkan guru dengan status "masuk"

---

## Kesimpulan

Custom endpoints GuruMengajar ini dirancang untuk:

1. **Kemudahan Penggunaan** - Tidak perlu query jadwal terlebih dahulu
2. **Efisiensi** - Mengurangi jumlah API call
3. **Intuitif** - Parameter yang dikirim sesuai dengan form input
4. **Flexible** - Bisa create baru atau update existing data
5. **Monitoring** - Endpoint khusus untuk track guru tidak masuk

**Next Steps:**
- Test semua endpoint dengan Postman
- Implementasi di Android app
- Monitor error logs untuk debugging
- Buat fitur notifikasi untuk guru tidak masuk

**Related Documentation:**
- `API_ENDPOINTS_DOCUMENTATION.md` - Dokumentasi lengkap semua API
- `POSTMAN_TESTING_GUIDE.md` - Panduan testing dengan Postman
- `CUSTOM_JADWAL_ENDPOINTS.md` - Custom endpoints untuk jadwal
- `QUICK_START_TOKEN.md` - Cara cepat mendapatkan token
- `CARA_MENDAPATKAN_TOKEN.md` - Panduan lengkap authentication

---

**📌 Catatan:** Pastikan Laravel server berjalan di `http://127.0.0.1:8000` sebelum testing API.

**❓ Pertanyaan atau Issue?** Cek error message dan status code untuk troubleshooting.
