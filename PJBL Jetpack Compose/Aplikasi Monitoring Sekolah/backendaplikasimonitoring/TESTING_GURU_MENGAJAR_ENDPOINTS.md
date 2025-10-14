# Testing Custom Guru Mengajar Endpoints

## Persiapan Testing

### 1. Pastikan Server Berjalan
Server harus running di `http://127.0.0.1:8000`

### 2. Login dan Dapatkan Token

```powershell
$loginResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "Accept"="application/json"} `
    -Body '{"email":"admin@example.com","password":"password"}'

$token = ($loginResponse.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

**Atau gunakan Postman:**
```
POST http://127.0.0.1:8000/api/login
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "password"
}
```

---

## Test 1: POST Guru Mengajar by Jadwal Params

### PowerShell:
```powershell
# Ganti YOUR_TOKEN dengan token dari login
$token = "YOUR_TOKEN"

$body = @{
    hari = "Senin"
    kelas_id = 1
    guru_id = 1
    mapel_id = 1
    jam_ke = "1"
    status = "masuk"
    keterangan = "Mengajar sesuai jadwal"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" `
    -Method POST `
    -Headers @{
        "Authorization"="Bearer $token"
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### cURL:
```bash
curl -X POST "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"hari\":\"Senin\",\"kelas_id\":1,\"guru_id\":1,\"mapel_id\":1,\"jam_ke\":\"1\",\"status\":\"masuk\",\"keterangan\":\"Mengajar sesuai jadwal\"}"
```

### Expected Result:
```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil ditambahkan",
    "data": {
        "id": 8,
        "jadwal_id": 1,
        "status": "masuk",
        "keterangan": "Mengajar sesuai jadwal",
        "created_at": "2025-01-12T10:30:00.000000Z",
        "updated_at": "2025-01-12T10:30:00.000000Z",
        "jadwal": {
            "id": 1,
            "guru_id": 1,
            "mapel_id": 1,
            "tahun_ajaran_id": 1,
            "kelas_id": 1,
            "jam_ke": "1",
            "hari": "Senin",
            "guru": {
                "id": 1,
                "kode_guru": "G001",
                "nama_guru": "Budi Santoso, S.Pd",
                "telepon": "081234567890"
            },
            "mapel": {
                "id": 1,
                "kode_mapel": "M001",
                "nama_mapel": "Bahasa Indonesia"
            },
            "kelas": {
                "id": 1,
                "nama_kelas": "X IPA 1"
            }
        }
    }
}
```

---

## Test 2: PUT Guru Mengajar by Jadwal Params (Update Status)

### PowerShell:
```powershell
$token = "YOUR_TOKEN"

$body = @{
    hari = "Senin"
    kelas_id = 1
    guru_id = 1
    mapel_id = 1
    jam_ke = "1"
    status = "tidak_masuk"
    keterangan = "Sakit"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" `
    -Method PUT `
    -Headers @{
        "Authorization"="Bearer $token"
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### cURL:
```bash
curl -X PUT "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"hari\":\"Senin\",\"kelas_id\":1,\"guru_id\":1,\"mapel_id\":1,\"jam_ke\":\"1\",\"status\":\"tidak_masuk\",\"keterangan\":\"Sakit\"}"
```

### Expected Result:
```json
{
    "success": true,
    "message": "Data Guru Mengajar berhasil diupdate",
    "data": {
        "id": 8,
        "jadwal_id": 1,
        "status": "tidak_masuk",
        "keterangan": "Sakit",
        "created_at": "2025-01-12T10:30:00.000000Z",
        "updated_at": "2025-01-12T11:00:00.000000Z",
        "jadwal": {
            // ... data jadwal dengan relasi
        }
    }
}
```

---

## Test 3: GET Guru Mengajar by Hari dan Kelas

### PowerShell:
```powershell
$token = "YOUR_TOKEN"

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/hari/Senin/kelas/1" `
    -Method GET `
    -Headers @{
        "Authorization"="Bearer $token"
        "Accept"="application/json"
    }

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### cURL:
```bash
curl -X GET "http://127.0.0.1:8000/api/guru-mengajars/hari/Senin/kelas/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Expected Result:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nama_guru": "Budi Santoso, S.Pd",
            "mapel": "Bahasa Indonesia",
            "jam_ke": "1",
            "status": "tidak_masuk",
            "keterangan": "Sakit"
        },
        {
            "id": 2,
            "nama_guru": "Siti Nurhaliza, S.Pd",
            "mapel": "Matematika",
            "jam_ke": "2",
            "status": "masuk",
            "keterangan": "Mengajar sesuai jadwal"
        }
    ]
}
```

---

## Test 4: GET Guru Tidak Masuk by Hari dan Kelas

### PowerShell:
```powershell
$token = "YOUR_TOKEN"

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/tidak-masuk/hari/Senin/kelas/1" `
    -Method GET `
    -Headers @{
        "Authorization"="Bearer $token"
        "Accept"="application/json"
    }

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### cURL:
```bash
curl -X GET "http://127.0.0.1:8000/api/guru-mengajars/tidak-masuk/hari/Senin/kelas/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Expected Result:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nama_guru": "Budi Santoso, S.Pd",
            "mapel": "Bahasa Indonesia",
            "jam_ke": "1",
            "status": "tidak_masuk",
            "keterangan": "Sakit"
        }
    ]
}
```

**Note:** Hanya menampilkan guru dengan status "tidak_masuk"

---

## Test 5: Error Cases

### Test 5.1: Jadwal Tidak Ditemukan (404)

```powershell
$token = "YOUR_TOKEN"

$body = @{
    hari = "Senin"
    kelas_id = 999  # Kelas ID yang tidak ada
    guru_id = 1
    mapel_id = 1
    jam_ke = "1"
    status = "masuk"
    keterangan = "Test"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" `
    -Method POST `
    -Headers @{
        "Authorization"="Bearer $token"
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body $body `
    -SkipHttpErrorCheck

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected:**
```json
{
    "success": false,
    "message": "Jadwal tidak ditemukan dengan parameter tersebut"
}
```

### Test 5.2: Validation Error (422)

```powershell
$token = "YOUR_TOKEN"

$body = @{
    hari = "InvalidDay"  # Hari invalid
    kelas_id = 1
    guru_id = 1
    mapel_id = 1
    jam_ke = "1"
    status = "invalid_status"  # Status invalid
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/by-jadwal" `
    -Method POST `
    -Headers @{
        "Authorization"="Bearer $token"
        "Content-Type"="application/json"
        "Accept"="application/json"
    } `
    -Body $body `
    -SkipHttpErrorCheck

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected:**
```json
{
    "message": "The hari field must be one of: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu. (and 1 more error)",
    "errors": {
        "hari": [
            "The selected hari is invalid."
        ],
        "status": [
            "The selected status is invalid."
        ]
    }
}
```

### Test 5.3: No Data Found (404)

```powershell
$token = "YOUR_TOKEN"

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/guru-mengajars/tidak-masuk/hari/Minggu/kelas/999" `
    -Method GET `
    -Headers @{
        "Authorization"="Bearer $token"
        "Accept"="application/json"
    } `
    -SkipHttpErrorCheck

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected:**
```json
{
    "success": false,
    "message": "Tidak ada guru yang tidak masuk untuk hari dan kelas tersebut"
}
```

---

## Testing dengan Postman Collection

### Import ke Postman

1. **Buat Collection:** "Guru Mengajar Custom Endpoints"

2. **Add Environment Variable:**
   - Variable: `base_url` = `http://127.0.0.1:8000/api`
   - Variable: `token` = `YOUR_TOKEN_HERE`

3. **Add Requests:**

#### Request 1: Login
```
POST {{base_url}}/login
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "password"
}
```

#### Request 2: POST by Jadwal
```
POST {{base_url}}/guru-mengajars/by-jadwal
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 1,
    "mapel_id": 1,
    "jam_ke": "1",
    "status": "masuk",
    "keterangan": "Mengajar sesuai jadwal"
}
```

#### Request 3: PUT by Jadwal
```
PUT {{base_url}}/guru-mengajars/by-jadwal
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 1,
    "mapel_id": 1,
    "jam_ke": "1",
    "status": "tidak_masuk",
    "keterangan": "Sakit"
}
```

#### Request 4: GET by Hari Kelas
```
GET {{base_url}}/guru-mengajars/hari/Senin/kelas/1
Authorization: Bearer {{token}}
```

#### Request 5: GET Tidak Masuk
```
GET {{base_url}}/guru-mengajars/tidak-masuk/hari/Senin/kelas/1
Authorization: Bearer {{token}}
```

---

## Data Sample untuk Testing

Berdasarkan seeder yang sudah dibuat, gunakan kombinasi data ini:

### Sample Jadwal yang Ada:
1. **Jadwal 1:** Hari=Senin, Kelas=1, Guru=1, Mapel=1, Jam="1"
2. **Jadwal 2:** Hari=Senin, Kelas=1, Guru=2, Mapel=2, Jam="2"
3. **Jadwal 3:** Hari=Selasa, Kelas=2, Guru=3, Mapel=3, Jam="1"
4. **Jadwal 4:** Hari=Rabu, Kelas=3, Guru=4, Mapel=4, Jam="3"

### Test Case Scenarios:

#### ✅ Scenario 1: Input Kehadiran Normal
```json
{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 1,
    "mapel_id": 1,
    "jam_ke": "1",
    "status": "masuk",
    "keterangan": "Mengajar sesuai jadwal"
}
```
**Expected:** Success, guru mengajar created

#### ✅ Scenario 2: Update Status ke Tidak Masuk
```json
{
    "hari": "Senin",
    "kelas_id": 1,
    "guru_id": 1,
    "mapel_id": 1,
    "jam_ke": "1",
    "status": "tidak_masuk",
    "keterangan": "Sakit flu"
}
```
**Expected:** Success, status updated to tidak_masuk

#### ✅ Scenario 3: Input Multiple Kehadiran
Lakukan POST berulang dengan data berbeda (guru 2, 3, 4)
**Expected:** Success, multiple records created

#### ✅ Scenario 4: View All Guru Mengajar Senin Kelas 1
GET `/guru-mengajars/hari/Senin/kelas/1`
**Expected:** Array of all guru mengajar for Senin kelas 1

#### ✅ Scenario 5: Filter Guru Tidak Masuk
GET `/guru-mengajars/tidak-masuk/hari/Senin/kelas/1`
**Expected:** Only shows guru with status tidak_masuk

---

## Checklist Testing

### ✅ Functionality Tests
- [ ] POST with valid data creates guru mengajar
- [ ] POST returns jadwal relations (guru, mapel, kelas)
- [ ] PUT updates existing record (status & keterangan only)
- [ ] PUT creates new record if not exist
- [ ] GET by hari/kelas returns all guru mengajar
- [ ] GET tidak-masuk filters by status correctly
- [ ] Response format consistent across endpoints

### ✅ Validation Tests
- [ ] Invalid hari returns 422 error
- [ ] Invalid status returns 422 error
- [ ] Non-existent kelas_id returns 422 error
- [ ] Non-existent guru_id returns 422 error
- [ ] Non-existent mapel_id returns 422 error
- [ ] Missing required fields returns 422 error

### ✅ Error Handling Tests
- [ ] Jadwal not found returns 404 with clear message
- [ ] No data returns 404 with clear message
- [ ] Invalid token returns 401 unauthorized
- [ ] Missing token returns 401 unauthorized

### ✅ Edge Cases
- [ ] Keterangan nullable works (can be omitted)
- [ ] Same jadwal params update instead of duplicate
- [ ] Multiple guru mengajar for same class/day works
- [ ] Special characters in keterangan handled correctly

---

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:** 
1. Check token is correct
2. Token must start with "Bearer " (with space)
3. Login again to get fresh token

### Issue: 404 Jadwal Not Found
**Solution:**
1. Check if jadwal exists: `GET /api/jadwals`
2. Verify hari, kelas_id, guru_id, mapel_id, jam_ke combination
3. Create jadwal if not exist: `POST /api/jadwals`

### Issue: 422 Validation Error
**Solution:**
1. Check all required fields present
2. Verify hari is one of: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
3. Verify status is: masuk or tidak_masuk
4. Check IDs exist in database

### Issue: Server Error 500
**Solution:**
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check database connection
3. Verify migrations ran successfully
4. Check if relationships properly defined in models

---

## Next Steps

After testing successfully:

1. ✅ **Verify all endpoints work** with Postman/cURL
2. 📱 **Implement in Android app** using Retrofit
3. 📊 **Create dashboard** to display guru tidak masuk
4. 🔔 **Add notifications** for absent teachers
5. 📈 **Generate reports** from guru mengajar data

---

## Related Documentation

- `CUSTOM_GURU_MENGAJAR_ENDPOINTS.md` - Detailed API documentation
- `API_ENDPOINTS_DOCUMENTATION.md` - Complete API reference
- `POSTMAN_TESTING_GUIDE.md` - General Postman testing guide
- `QUICK_START_TOKEN.md` - Quick token acquisition guide
- `CARA_MENDAPATKAN_TOKEN.md` - Detailed authentication guide

---

**📌 Important Notes:**

1. **Server must be running:** `php artisan serve`
2. **Database must be seeded:** `php artisan migrate:fresh --seed`
3. **Token required:** Get from login endpoint first
4. **Valid test data:** Use existing guru_id, mapel_id, kelas_id from seeder

**🎯 Goal:** All 4 custom endpoints should work perfectly before mobile app integration.
