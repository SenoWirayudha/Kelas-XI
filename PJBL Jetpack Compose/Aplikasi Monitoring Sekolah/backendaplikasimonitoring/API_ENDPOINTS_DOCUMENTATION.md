# API Endpoints Documentation - Aplikasi Monitoring Sekolah

Base URL: `http://127.0.0.1:8000/api`

## 🔐 Authentication

Semua endpoint (kecuali login dan register) memerlukan authentication token. Tambahkan token di Header:
```
Authorization: Bearer {your_token}
Accept: application/json
Content-Type: application/json
```

**❓ Cara mendapatkan token?** 
👉 Baca: **`QUICK_START_TOKEN.md`** atau **`CARA_MENDAPATKAN_TOKEN.md`**

---

## 1. Authentication Endpoints

### 1.1 Login
**POST** `/login`

**Request Body:**
```json
{
    "email": "siswa2@sekolah.com",
    "password": "password"
}
```

**Response Success (200):**
```json
{
    "token": "1|abc123...",
    "user": {
        "id": 2,
        "name": "Siswa 2",
        "email": "siswa2@sekolah.com",
        "role": "siswa"
    }
}
```

### 1.2 Logout
**POST** `/logout`

**Headers:** Requires Bearer Token

**Response Success (200):**
```json
{
    "message": "Logged out successfully"
}
```

---

## 2. Guru Endpoints

### 2.1 Get All Guru
**GET** `/gurus`

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "kode_guru": "GR001",
            "nama_guru": "Budi Santoso",
            "telepon": "081234567890",
            "created_at": "2025-10-11T12:00:00.000000Z",
            "updated_at": "2025-10-11T12:00:00.000000Z"
        }
    ]
}
```

### 2.2 Create Guru
**POST** `/gurus`

**Request Body:**
```json
{
    "kode_guru": "GR006",
    "nama_guru": "Sri Wahyuni",
    "telepon": "086789012345"
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "Guru berhasil ditambahkan",
    "data": {
        "id": 6,
        "kode_guru": "GR006",
        "nama_guru": "Sri Wahyuni",
        "telepon": "086789012345",
        "created_at": "2025-10-11T12:00:00.000000Z",
        "updated_at": "2025-10-11T12:00:00.000000Z"
    }
}
```

### 2.3 Get Single Guru
**GET** `/gurus/{id}`

Example: `GET /gurus/1`

**Response Success (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "kode_guru": "GR001",
        "nama_guru": "Budi Santoso",
        "telepon": "081234567890",
        "jadwals": [
            {
                "id": 1,
                "guru_id": 1,
                "mapel_id": 1,
                "tahun_ajaran_id": 2,
                "kelas_id": 1,
                "jam_ke": "1-2",
                "hari": "Senin"
            }
        ]
    }
}
```

### 2.4 Update Guru
**PUT** `/gurus/{id}`

Example: `PUT /gurus/1`

**Request Body:**
```json
{
    "nama_guru": "Budi Santoso Updated",
    "telepon": "081999999999"
}
```

**Response Success (200):**
```json
{
    "success": true,
    "message": "Guru berhasil diupdate",
    "data": {
        "id": 1,
        "kode_guru": "GR001",
        "nama_guru": "Budi Santoso Updated",
        "telepon": "081999999999"
    }
}
```

### 2.5 Delete Guru
**DELETE** `/gurus/{id}`

Example: `DELETE /gurus/1`

**Response Success (200):**
```json
{
    "success": true,
    "message": "Guru berhasil dihapus"
}
```

---

## 3. Mapel (Mata Pelajaran) Endpoints

### 3.1 Get All Mapel
**GET** `/mapels`

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "kode_mapel": "MAT",
            "nama_mapel": "Matematika",
            "created_at": "2025-10-11T12:00:00.000000Z",
            "updated_at": "2025-10-11T12:00:00.000000Z"
        }
    ]
}
```

### 3.2 Create Mapel
**POST** `/mapels`

**Request Body:**
```json
{
    "kode_mapel": "KIM",
    "nama_mapel": "Kimia"
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "Mapel berhasil ditambahkan",
    "data": {
        "id": 8,
        "kode_mapel": "KIM",
        "nama_mapel": "Kimia"
    }
}
```

### 3.3 Get Single Mapel
**GET** `/mapels/{id}`

### 3.4 Update Mapel
**PUT** `/mapels/{id}`

**Request Body:**
```json
{
    "nama_mapel": "Matematika Lanjut"
}
```

### 3.5 Delete Mapel
**DELETE** `/mapels/{id}`

---

## 4. Tahun Ajaran Endpoints

### 4.1 Get All Tahun Ajaran
**GET** `/tahun-ajarans`

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "tahun": "2023/2024",
            "flag": 0,
            "created_at": "2025-10-11T12:00:00.000000Z",
            "updated_at": "2025-10-11T12:00:00.000000Z"
        },
        {
            "id": 2,
            "tahun": "2024/2025",
            "flag": 1,
            "created_at": "2025-10-11T12:00:00.000000Z",
            "updated_at": "2025-10-11T12:00:00.000000Z"
        }
    ]
}
```

### 4.2 Create Tahun Ajaran
**POST** `/tahun-ajarans`

**Request Body:**
```json
{
    "tahun": "2026/2027",
    "flag": 0
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "Tahun Ajaran berhasil ditambahkan",
    "data": {
        "id": 4,
        "tahun": "2026/2027",
        "flag": 0
    }
}
```

### 4.3 Get Single Tahun Ajaran
**GET** `/tahun-ajarans/{id}`

### 4.4 Update Tahun Ajaran
**PUT** `/tahun-ajarans/{id}`

**Request Body:**
```json
{
    "flag": 1
}
```

### 4.5 Delete Tahun Ajaran
**DELETE** `/tahun-ajarans/{id}`

---

## 5. Kelas Endpoints

### 5.1 Get All Kelas
**GET** `/kelas`

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nama_kelas": "10 IPA 1",
            "created_at": "2025-10-11T12:00:00.000000Z",
            "updated_at": "2025-10-11T12:00:00.000000Z"
        }
    ]
}
```

### 5.2 Create Kelas
**POST** `/kelas`

**Request Body:**
```json
{
    "nama_kelas": "10 IPA 3"
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "Kelas berhasil ditambahkan",
    "data": {
        "id": 9,
        "nama_kelas": "10 IPA 3"
    }
}
```

### 5.3 Get Single Kelas
**GET** `/kelas/{id}`

### 5.4 Update Kelas
**PUT** `/kelas/{id}`

**Request Body:**
```json
{
    "nama_kelas": "10 IPA 1 (Updated)"
}
```

### 5.5 Delete Kelas
**DELETE** `/kelas/{id}`

---

## 6. Jadwal Endpoints

### 6.1 Get All Jadwal
**GET** `/jadwals`

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "guru_id": 1,
            "mapel_id": 1,
            "tahun_ajaran_id": 2,
            "kelas_id": 1,
            "jam_ke": "1-2",
            "hari": "Senin",
            "guru": {
                "id": 1,
                "kode_guru": "GR001",
                "nama_guru": "Budi Santoso"
            },
            "mapel": {
                "id": 1,
                "kode_mapel": "MAT",
                "nama_mapel": "Matematika"
            },
            "tahun_ajaran": {
                "id": 2,
                "tahun": "2024/2025",
                "flag": 1
            },
            "kelas": {
                "id": 1,
                "nama_kelas": "10 IPA 1"
            }
        }
    ]
}
```

### 6.2 Create Jadwal
**POST** `/jadwals`

**Request Body:**
```json
{
    "guru_id": 1,
    "mapel_id": 1,
    "tahun_ajaran_id": 2,
    "kelas_id": 1,
    "jam_ke": "7-8",
    "hari": "Sabtu"
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "Jadwal berhasil ditambahkan",
    "data": {
        "id": 11,
        "guru_id": 1,
        "mapel_id": 1,
        "tahun_ajaran_id": 2,
        "kelas_id": 1,
        "jam_ke": "7-8",
        "hari": "Sabtu",
        "guru": {...},
        "mapel": {...},
        "tahun_ajaran": {...},
        "kelas": {...}
    }
}
```

### 6.3 Get Single Jadwal
**GET** `/jadwals/{id}`

**Response includes relationships with guru_mengajars**

### 6.4 Update Jadwal
**PUT** `/jadwals/{id}`

**Request Body:**
```json
{
    "jam_ke": "5-6",
    "hari": "Rabu"
}
```

### 6.5 Delete Jadwal
**DELETE** `/jadwals/{id}`

---

### 6.6 Get Jadwal by Kelas ID and Hari (Custom Endpoint)
**GET** `/jadwals/kelas/{kelasId}/hari/{hari}`

**Menampilkan:** Jam Ke, Mata Pelajaran, Kode Guru, Nama Guru

**Example:** `GET /jadwals/kelas/1/hari/Senin`

**Response Success (200):**
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
        }
    ]
}
```

**Response Error (404):**
```json
{
    "success": false,
    "message": "Tidak ada jadwal ditemukan untuk kelas dan hari tersebut"
}
```

**Valid Hari:** Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

---

### 6.7 Get Jadwal Detail by Hari and Kelas ID (Custom Endpoint)
**GET** `/jadwals/hari/{hari}/kelas/{kelasId}`

**Menampilkan:** Nama Guru, Mapel, Tahun Ajaran, Jam Ke, Kelas, Hari

**Example:** `GET /jadwals/hari/Senin/kelas/1`

**Response Success (200):**
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
        }
    ]
}
```

**Response Error (404):**
```json
{
    "success": false,
    "message": "Tidak ada jadwal ditemukan untuk hari dan kelas tersebut"
}
```

**Use Case:**
- Endpoint 6.6 lebih ringkas, cocok untuk menampilkan jadwal di UI mobile
- Endpoint 6.7 lebih lengkap, cocok untuk detail atau export data

---

## 7. Guru Mengajar Endpoints

**📚 Custom Endpoints Available!**
👉 Lihat dokumentasi lengkap di: **`CUSTOM_GURU_MENGAJAR_ENDPOINTS.md`**

Custom endpoints untuk kemudahan input kehadiran guru tanpa perlu mencari `jadwal_id` terlebih dahulu:
- `POST /guru-mengajars/by-jadwal` - Input kehadiran dengan parameter jadwal
- `PUT /guru-mengajars/by-jadwal` - Update status & keterangan
- `GET /guru-mengajars/hari/{hari}/kelas/{kelasId}` - Lihat daftar guru mengajar
- `GET /guru-mengajars/tidak-masuk/hari/{hari}/kelas/{kelasId}` - Lihat guru tidak masuk

### 7.1 Get All Guru Mengajar
**GET** `/guru-mengajars`

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "jadwal_id": 1,
            "keterangan": "Materi Aljabar",
            "status": "masuk",
            "created_at": "2025-10-11T12:00:00.000000Z",
            "updated_at": "2025-10-11T12:00:00.000000Z",
            "jadwal": {
                "id": 1,
                "jam_ke": "1-2",
                "hari": "Senin",
                "guru": {
                    "id": 1,
                    "nama_guru": "Budi Santoso"
                },
                "mapel": {
                    "id": 1,
                    "nama_mapel": "Matematika"
                },
                "kelas": {
                    "id": 1,
                    "nama_kelas": "10 IPA 1"
                }
            }
        }
    ]
}
```

### 7.2 Create Guru Mengajar
**POST** `/guru-mengajars`

**Request Body:**
```json
{
    "jadwal_id": 1,
    "keterangan": "Materi Geometri",
    "status": "masuk"
}
```

**Response Success (201):**
```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil ditambahkan",
    "data": {
        "id": 8,
        "jadwal_id": 1,
        "keterangan": "Materi Geometri",
        "status": "masuk",
        "jadwal": {...}
    }
}
```

### 7.3 Get Single Guru Mengajar
**GET** `/guru-mengajars/{id}`

### 7.4 Update Guru Mengajar
**PUT** `/guru-mengajars/{id}`

**Request Body:**
```json
{
    "status": "tidak_masuk",
    "keterangan": "Guru sakit"
}
```

**Response Success (200):**
```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil diupdate",
    "data": {
        "id": 1,
        "jadwal_id": 1,
        "keterangan": "Guru sakit",
        "status": "tidak_masuk"
    }
}
```

### 7.5 Delete Guru Mengajar
**DELETE** `/guru-mengajars/{id}`

**Response Success (200):**
```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil dihapus"
}
```

---

## Testing di Postman

### Setup:
1. **Import Collection**: Buat collection baru di Postman
2. **Set Base URL**: Create environment variable `base_url` = `http://127.0.0.1:8000/api`
3. **Login First**: 
   - POST ke `/login` dengan credentials
   - Copy token dari response
4. **Set Token**: Add to collection/environment variable `token`
5. **Authorization**: Di collection level, set:
   - Type: Bearer Token
   - Token: `{{token}}`

### Headers untuk semua request (kecuali login):
```
Authorization: Bearer {{token}}
Accept: application/json
Content-Type: application/json
```

### Test Flow:
1. **Login** → Get token
2. **GET** `/gurus` → List all guru
3. **POST** `/gurus` → Create new guru
4. **GET** `/gurus/6` → Get specific guru
5. **PUT** `/gurus/6` → Update guru
6. **DELETE** `/gurus/6` → Delete guru
7. Repeat for other resources (mapels, tahun-ajarans, kelas, jadwals, guru-mengajars)

### Sample User Credentials (from UserSeeder):
```
Admin: admin@sekolah.com / password
Siswa 1: siswa1@sekolah.com / password
Siswa 2: siswa2@sekolah.com / password
Kurikulum: kurikulum@sekolah.com / password
Kepala Sekolah: kepalasekolah@sekolah.com / password
```

---

## Validation Rules

### Guru:
- `kode_guru`: required, unique, string
- `nama_guru`: required, string, max 255
- `telepon`: nullable, string, max 20

### Mapel:
- `kode_mapel`: required, string, max 255
- `nama_mapel`: required, string, max 255

### Tahun Ajaran:
- `tahun`: required, string, max 255
- `flag`: sometimes, boolean (default: 1)

### Kelas:
- `nama_kelas`: required, string, max 255

### Jadwal:
- `guru_id`: required, exists in gurus table
- `mapel_id`: required, exists in mapels table
- `tahun_ajaran_id`: required, exists in tahun_ajarans table
- `kelas_id`: required, exists in kelas table
- `jam_ke`: required, string, max 50
- `hari`: required, enum (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)

### Guru Mengajar:
- `jadwal_id`: required, exists in jadwals table
- `keterangan`: nullable, text
- `status`: required, enum (masuk, tidak_masuk)

---

## Error Responses

### 401 Unauthorized:
```json
{
    "message": "Unauthenticated."
}
```

### 422 Validation Error:
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "kode_guru": [
            "The kode guru field is required."
        ]
    }
}
```

### 404 Not Found:
```json
{
    "message": "No query results for model [App\\Models\\Guru] 999"
}
```

---

## Database Relationships

1. **Guru** → hasMany → **Jadwal**
2. **Mapel** → hasMany → **Jadwal**
3. **TahunAjaran** → hasMany → **Jadwal**
4. **Kelas** → hasMany → **Jadwal**
5. **Jadwal** → belongsTo → **Guru, Mapel, TahunAjaran, Kelas**
6. **Jadwal** → hasMany → **GuruMengajar**
7. **GuruMengajar** → belongsTo → **Jadwal**

---

## Notes:
- Semua endpoint (kecuali login/register) memerlukan authentication
- Token expired setelah logout
- Use `php artisan migrate:fresh --seed` untuk reset database dengan sample data
- Default tahun ajaran aktif memiliki flag = 1
- Status guru mengajar: "masuk" atau "tidak_masuk"
- Hari valid: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
