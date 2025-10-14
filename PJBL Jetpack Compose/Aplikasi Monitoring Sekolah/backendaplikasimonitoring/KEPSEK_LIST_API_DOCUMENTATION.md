# API Documentation: Guru Mengajar by Hari dan Kelas (KepsekActivity - List Page)

## Endpoint Information

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/guru-mengajar/by-hari-kelas`  
**Authentication:** Required (Bearer Token)

---

## Purpose

Endpoint ini digunakan untuk mengambil data guru mengajar berdasarkan **hari** dan **kelas_id**. Endpoint ini menggunakan method POST untuk compatibility dengan aplikasi mobile.

---

## Request

### Headers
```
Authorization: Bearer {your_token}
Content-Type: application/json
Accept: application/json
```

### Request Body

```json
{
    "hari": "Senin",
    "kelas_id": 1
}
```

### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `hari` | string | ✅ Yes | Must be one of: `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu`, `Minggu` |
| `kelas_id` | integer | ✅ Yes | Must exist in `kelas` table |

---

## Response

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Data guru mengajar berhasil diambil",
    "data": [
        {
            "id": 1,
            "nama_guru": "Budi Santoso",
            "mapel": "Matematika",
            "status": "masuk",
            "keterangan": "Materi Aljabar"
        },
        {
            "id": 2,
            "nama_guru": "Siti Nurhaliza",
            "mapel": "Ilmu Pengetahuan Alam",
            "status": "masuk",
            "keterangan": "Praktikum Fisika"
        },
        {
            "id": 6,
            "nama_guru": "Budi Santoso",
            "mapel": "Matematika",
            "status": "tidak_masuk",
            "keterangan": "Guru Izin Sakit"
        },
        {
            "id": 3,
            "nama_guru": "Ahmad Fauzi",
            "mapel": "Bahasa Indonesia",
            "status": "masuk",
            "keterangan": "Latihan Menulis Esai"
        }
    ]
}
```

### Response when no data (200 OK)

```json
{
    "success": true,
    "message": "Data guru mengajar berhasil diambil",
    "data": []
}
```

### Error Responses

#### 422 Unprocessable Entity (Validation Error)

```json
{
    "message": "The hari field is required. (and 1 more error)",
    "errors": {
        "hari": [
            "The hari field is required."
        ],
        "kelas_id": [
            "The kelas id field is required."
        ]
    }
}
```

#### 422 Invalid Hari Value

```json
{
    "message": "The selected hari is invalid.",
    "errors": {
        "hari": [
            "The selected hari is invalid."
        ]
    }
}
```

#### 422 Invalid Kelas ID

```json
{
    "message": "The selected kelas id is invalid.",
    "errors": {
        "kelas_id": [
            "The selected kelas id is invalid."
        ]
    }
}
```

#### 401 Unauthorized

```json
{
    "message": "Unauthenticated."
}
```

---

## Response Fields Explanation

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `message` | string | Success or error message |
| `data` | array | Array of guru mengajar objects |
| `data[].id` | integer | ID of the guru_mengajar record |
| `data[].nama_guru` | string | Nama lengkap guru (from jadwal.guru relation) |
| `data[].mapel` | string | Nama mata pelajaran (from jadwal.mapel relation) |
| `data[].status` | string | Status kehadiran: `"masuk"` atau `"tidak_masuk"` |
| `data[].keterangan` | string/null | Keterangan/catatan tambahan |

---

## Testing Examples

### Using PowerShell (Windows)

#### 1. Login to get token

```powershell
$loginResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/login" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body '{"email":"admin@sekolah.com","password":"password"}'

$token = ($loginResponse.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

#### 2. Get guru mengajar data

```powershell
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajar/by-hari-kelas" `
    -Method POST `
    -Headers @{
        "Authorization"="Bearer $token"
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body '{"hari":"Senin","kelas_id":1}'

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

#### 3. Test different hari and kelas

```powershell
# Test Selasa, Kelas 1
$body = @{
    hari = "Selasa"
    kelas_id = 1
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajar/by-hari-kelas" `
    -Method POST `
    -Headers @{
        "Authorization"="Bearer $token"
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### Using cURL

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@sekolah.com","password":"password"}'

# Get guru mengajar (replace {TOKEN} with actual token)
curl -X POST http://127.0.0.1:8000/api/guru-mengajar/by-hari-kelas \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"hari":"Senin","kelas_id":1}'
```

### Using Postman

1. **Create a new POST request**
   - URL: `http://127.0.0.1:8000/api/guru-mengajar/by-hari-kelas`

2. **Set Headers:**
   - `Authorization`: `Bearer {your_token}`
   - `Content-Type`: `application/json`
   - `Accept`: `application/json`

3. **Set Body (raw JSON):**
   ```json
   {
       "hari": "Senin",
       "kelas_id": 1
   }
   ```

4. **Click Send**

---

## Database Structure Reference

### Tables Involved

1. **guru_mengajars**
   - `id` (primary key)
   - `jadwal_id` (foreign key to jadwals)
   - `status` (masuk/tidak_masuk)
   - `keterangan` (nullable)
   - `created_at`, `updated_at`

2. **jadwals**
   - `id` (primary key)
   - `guru_id` (foreign key to gurus)
   - `mapel_id` (foreign key to mapels)
   - `kelas_id` (foreign key to kelas)
   - `tahun_ajaran_id` (foreign key to tahun_ajarans)
   - `hari` (Senin-Minggu)
   - `jam_ke` (e.g., "1-2", "3-4")
   - `created_at`, `updated_at`

3. **gurus**
   - `id`, `kode_guru`, `nama_guru`, `telepon`

4. **mapels**
   - `id`, `kode_mapel`, `nama_mapel`

5. **kelas**
   - `id`, `nama_kelas`

---

## Controller Logic

**File:** `app/Http/Controllers/GuruMengajarController.php`

**Method:** `getByHariKelasPost(Request $request)`

### Query Logic:

```php
GuruMengajar::whereHas('jadwal', function ($query) use ($request) {
    $query->where('hari', $request->hari)
          ->where('kelas_id', $request->kelas_id);
})
->with(['jadwal.guru', 'jadwal.mapel'])
->get()
->map(function ($item) {
    return [
        'id' => $item->id,
        'nama_guru' => $item->jadwal->guru->nama_guru,
        'mapel' => $item->jadwal->mapel->nama_mapel,
        'status' => $item->status,
        'keterangan' => $item->keterangan
    ];
});
```

### Key Points:

1. **Uses `whereHas()`** to filter guru_mengajars based on related jadwal's hari and kelas_id
2. **Eager loads** `jadwal.guru` and `jadwal.mapel` relationships to avoid N+1 queries
3. **Maps the result** to simplify the response structure
4. **Always returns array** (empty array if no data found)

---

## Sample Test Data

Based on current database seeder:

### Kelas 1 (10 IPA 1) - Senin

| ID | Nama Guru | Mapel | Jam Ke | Status | Keterangan |
|----|-----------|-------|--------|--------|------------|
| 1 | Budi Santoso | Matematika | 1-2 | masuk | Materi Aljabar |
| 2 | Siti Nurhaliza | Ilmu Pengetahuan Alam | 3-4 | masuk | Praktikum Fisika |
| 3 | Ahmad Fauzi | Bahasa Indonesia | 5-6 | masuk | Latihan Menulis Esai |
| 6 | Budi Santoso | Matematika | 1-2 | tidak_masuk | Guru Izin Sakit |

### Kelas 1 (10 IPA 1) - Selasa

| ID | Nama Guru | Mapel | Jam Ke | Status | Keterangan |
|----|-----------|-------|--------|--------|------------|
| 4 | Dewi Lestari | Bahasa Inggris | 1-2 | masuk | Grammar and Vocabulary |
| 5 | Rudi Hermawan | Pendidikan Jasmani | 3-4 | masuk | Olahraga Futsal |

---

## Integration with Android (Kotlin + Jetpack Compose)

### 1. Data Models

**File:** `GuruMengajarModels.kt`

```kotlin
data class GuruMengajarByHariKelasRequest(
    @SerializedName("hari")
    val hari: String,
    
    @SerializedName("kelas_id")
    val kelasId: Int
)

data class GuruMengajarData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("nama_guru")
    val namaGuru: String,
    
    @SerializedName("mapel")
    val mapel: String,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("keterangan")
    val keterangan: String?
)

data class GuruMengajarListResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: List<GuruMengajarData>
)
```

### 2. API Service Interface

**File:** `ApiService.kt`

```kotlin
@POST("guru-mengajar/by-hari-kelas")
suspend fun getGuruMengajarByHariKelas(
    @Header("Authorization") token: String,
    @Body request: GuruMengajarByHariKelasRequest
): Response<GuruMengajarListResponse>
```

### 3. Usage in Composable

**File:** `ListKepsekScreen.kt`

```kotlin
fun loadGuruMengajar() {
    if (selectedKelas == null || selectedHari.isEmpty()) {
        Toast.makeText(context, "Pilih Kelas dan Hari terlebih dahulu", Toast.LENGTH_SHORT).show()
        return
    }
    
    scope.launch {
        isLoadingGuruMengajar = true
        val token = "Bearer ${tokenManager.getToken()}"
        val request = GuruMengajarByHariKelasRequest(
            hari = selectedHari,
            kelasId = selectedKelas!!.id
        )
        
        when (val result = ApiHelper.safeApiCall { 
            apiService.getGuruMengajarByHariKelas(token, request) 
        }) {
            is ApiResult.Success -> {
                guruMengajarList = result.data.data
                if (guruMengajarList.isEmpty()) {
                    Toast.makeText(context, "Tidak ada data", Toast.LENGTH_SHORT).show()
                }
            }
            is ApiResult.Error -> {
                Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                guruMengajarList = emptyList()
            }
            ApiResult.Loading -> {}
        }
        isLoadingGuruMengajar = false
    }
}
```

---

## Troubleshooting

### Problem 1: Empty Response Data

**Symptoms:** `data: []` is returned even though database has data

**Causes:**
1. No guru_mengajar records for that hari/kelas_id combination
2. Check if jadwal exists for that hari/kelas_id
3. Check if guru_mengajar records are linked to correct jadwal_id

**Solution:**
```sql
-- Check jadwals
SELECT * FROM jadwals WHERE hari = 'Senin' AND kelas_id = 1;

-- Check guru_mengajars for those jadwal_ids
SELECT gm.*, j.hari, j.kelas_id 
FROM guru_mengajars gm 
JOIN jadwals j ON gm.jadwal_id = j.id 
WHERE j.hari = 'Senin' AND j.kelas_id = 1;
```

### Problem 2: Validation Error "hari is invalid"

**Symptoms:** 422 error with message "The selected hari is invalid"

**Cause:** Typo in hari value or using wrong capitalization

**Solution:** Use exact values: `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu`, `Minggu` (with capital first letter)

### Problem 3: Validation Error "kelas_id is invalid"

**Symptoms:** 422 error with message "The selected kelas id is invalid"

**Cause:** kelas_id doesn't exist in database

**Solution:** 
```bash
# Check available kelas IDs
php artisan tinker --execute="echo json_encode(App\Models\Kelas::all(['id','nama_kelas'])->toArray(), JSON_PRETTY_PRINT);"
```

### Problem 4: 401 Unauthorized

**Symptoms:** `{"message": "Unauthenticated."}`

**Cause:** Missing or invalid Bearer token

**Solution:**
1. Check if token is included in Authorization header
2. Verify token format: `Bearer {token}`
3. Get new token by logging in again
4. Check token expiration in Sanctum config

---

## Related Endpoints

### Alternative GET Method

```
GET /api/guru-mengajars/hari/{hari}/kelas/{kelasId}
```

This is the original GET version that returns the same data.

**Example:**
```
GET http://127.0.0.1:8000/api/guru-mengajars/hari/Senin/kelas/1
Authorization: Bearer {token}
```

### Get Only "Tidak Masuk" Guru

```
GET /api/guru-mengajars/tidak-masuk/hari/{hari}/kelas/{kelasId}
```

Filters only guru with `status = "tidak_masuk"`

---

## Notes

1. **Duplicate jadwal_id**: Database allows multiple guru_mengajar records for the same jadwal_id (e.g., one for status "masuk" and another for status "tidak_masuk" on different dates)

2. **Status values**: Only two valid values:
   - `"masuk"` - Guru hadir/mengajar
   - `"tidak_masuk"` - Guru tidak hadir

3. **Keterangan**: Optional field for additional notes/remarks

4. **Performance**: Query uses eager loading (`.with()`) to optimize database queries

5. **Sanctum Authentication**: This endpoint is protected by `auth:sanctum` middleware

---

## Version History

- **v1.0.0** (2025-10-11): Initial endpoint created for KepsekActivity List Page
- Method: POST for mobile app compatibility
- Returns: id, nama_guru, mapel, status, keterangan

---

## Contact & Support

For issues or questions, refer to:
- Main API Documentation: `API_DOCUMENTATION.md`
- GuruMengajar Custom Endpoints: `CUSTOM_GURU_MENGAJAR_ENDPOINTS.md`
- Testing Guide: `TESTING_GURU_MENGAJAR_ENDPOINTS.md`
