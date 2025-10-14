# User Management API - Testing Guide

## 📋 Overview

API untuk manage user (CRUD operations) di aplikasi monitoring sekolah. Endpoint ini digunakan oleh Admin untuk mengelola akun user.

**Base URL:** `http://127.0.0.1:8000/api`

---

## 🔐 Authentication

Semua endpoint membutuhkan authentication token:

```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json
```

---

## 📖 API Endpoints

### 1. GET All Users

**Endpoint:** `GET /api/users`

**Description:** Mendapatkan daftar semua user

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Accept: application/json
```

**Response Success (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Admin",
            "email": "admin@example.com",
            "role": "admin",
            "email_verified_at": null,
            "created_at": "2025-10-11T10:00:00.000000Z",
            "updated_at": "2025-10-11T10:00:00.000000Z"
        },
        {
            "id": 2,
            "name": "Siswa 1",
            "email": "siswa1@sekolah.com",
            "role": "siswa",
            "email_verified_at": null,
            "created_at": "2025-10-11T10:00:00.000000Z",
            "updated_at": "2025-10-11T10:00:00.000000Z"
        }
    ]
}
```

**cURL:**
```bash
curl -X GET "http://127.0.0.1:8000/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

### 2. POST Create User

**Endpoint:** `POST /api/users`

**Description:** Membuat user baru

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
    "name": "User Baru",
    "email": "userbaru@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "siswa"
}
```

**Request Fields:**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| name | string | ✅ Yes | Nama lengkap user | Max 255 characters |
| email | string | ✅ Yes | Email user | Valid email, unique |
| password | string | ✅ Yes | Password | Min 8 characters |
| password_confirmation | string | ✅ Yes | Konfirmasi password | Must match password |
| role | string | ✅ Yes | Role user | `siswa`, `kurikulum`, `kepala_sekolah`, `admin` |

**Response Success (201):**
```json
{
    "success": true,
    "message": "User berhasil ditambahkan",
    "data": {
        "id": 10,
        "name": "User Baru",
        "email": "userbaru@example.com",
        "role": "siswa",
        "email_verified_at": null,
        "created_at": "2025-10-11T15:30:00.000000Z",
        "updated_at": "2025-10-11T15:30:00.000000Z"
    }
}
```

**Response Error - Validation (422):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": [
            "The email has already been taken."
        ],
        "password": [
            "The password field confirmation does not match."
        ]
    }
}
```

**cURL:**
```bash
curl -X POST "http://127.0.0.1:8000/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "User Baru",
    "email": "userbaru@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "siswa"
  }'
```

---

### 3. GET Single User

**Endpoint:** `GET /api/users/{id}`

**Description:** Mendapatkan detail user berdasarkan ID

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Accept: application/json
```

**Response Success (200):**
```json
{
    "success": true,
    "data": {
        "id": 10,
        "name": "User Baru",
        "email": "userbaru@example.com",
        "role": "siswa",
        "email_verified_at": null,
        "created_at": "2025-10-11T15:30:00.000000Z",
        "updated_at": "2025-10-11T15:30:00.000000Z"
    }
}
```

**Response Error - Not Found (404):**
```json
{
    "success": false,
    "message": "User tidak ditemukan"
}
```

**cURL:**
```bash
curl -X GET "http://127.0.0.1:8000/api/users/10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

### 4. PUT Update User

**Endpoint:** `PUT /api/users/{id}`

**Description:** Update data user. Password optional (jika tidak diisi, password tidak berubah)

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json
```

**Request Body (Tanpa Update Password):**
```json
{
    "name": "User Updated",
    "email": "userupdated@example.com",
    "role": "kurikulum"
}
```

**Request Body (Dengan Update Password):**
```json
{
    "name": "User Updated",
    "email": "userupdated@example.com",
    "role": "kurikulum",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

**Request Fields:**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| name | string | ✅ Yes | Nama lengkap user | Max 255 characters |
| email | string | ✅ Yes | Email user | Valid email, unique (except current user) |
| role | string | ✅ Yes | Role user | `siswa`, `kurikulum`, `kepala_sekolah`, `admin` |
| password | string | ❌ No | Password baru | Min 8 characters (if provided) |
| password_confirmation | string | ❌ No | Konfirmasi password | Must match password (if provided) |

**Response Success (200):**
```json
{
    "success": true,
    "message": "User berhasil diupdate",
    "data": {
        "id": 10,
        "name": "User Updated",
        "email": "userupdated@example.com",
        "role": "kurikulum",
        "email_verified_at": null,
        "created_at": "2025-10-11T15:30:00.000000Z",
        "updated_at": "2025-10-11T16:00:00.000000Z"
    }
}
```

**Response Error - Not Found (404):**
```json
{
    "success": false,
    "message": "User tidak ditemukan"
}
```

**Response Error - Validation (422):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": [
            "The email has already been taken."
        ]
    }
}
```

**cURL (Tanpa Password):**
```bash
curl -X PUT "http://127.0.0.1:8000/api/users/10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "User Updated",
    "email": "userupdated@example.com",
    "role": "kurikulum"
  }'
```

**cURL (Dengan Password):**
```bash
curl -X PUT "http://127.0.0.1:8000/api/users/10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "User Updated",
    "email": "userupdated@example.com",
    "role": "kurikulum",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
  }'
```

---

### 5. DELETE User

**Endpoint:** `DELETE /api/users/{id}`

**Description:** Menghapus user

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Accept: application/json
```

**Response Success (200):**
```json
{
    "success": true,
    "message": "User berhasil dihapus"
}
```

**Response Error - Not Found (404):**
```json
{
    "success": false,
    "message": "User tidak ditemukan"
}
```

**cURL:**
```bash
curl -X DELETE "http://127.0.0.1:8000/api/users/10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

## 🧪 Testing dengan Postman

### Step 1: Login untuk Dapat Token

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/login`

**Body:**
```json
{
    "email": "admin@example.com",
    "password": "password"
}
```

**Response:**
```json
{
    "token": "2|abc123xyz...",
    "user": { ... }
}
```

Copy token dan simpan di Postman environment variable `token`.

---

### Step 2: GET All Users

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/users`  
**Headers:**
- Authorization: `Bearer {{token}}`
- Accept: `application/json`

---

### Step 3: POST Create User

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/users`  
**Headers:**
- Authorization: `Bearer {{token}}`
- Content-Type: `application/json`
- Accept: `application/json`

**Body (raw JSON):**
```json
{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "siswa"
}
```

---

### Step 4: PUT Update User

**Method:** `PUT`  
**URL:** `http://127.0.0.1:8000/api/users/10`  
**Headers:**
- Authorization: `Bearer {{token}}`
- Content-Type: `application/json`
- Accept: `application/json`

**Body (raw JSON):**
```json
{
    "name": "Test User Updated",
    "email": "testuser@example.com",
    "role": "kurikulum"
}
```

---

### Step 5: DELETE User

**Method:** `DELETE`  
**URL:** `http://127.0.0.1:8000/api/users/10`  
**Headers:**
- Authorization: `Bearer {{token}}`
- Accept: `application/json`

---

## ✅ Validation Rules

### Role Values

| Value | Display Name |
|-------|-------------|
| `siswa` | Siswa |
| `kurikulum` | Kurikulum |
| `kepala_sekolah` | Kepala Sekolah |
| `admin` | Admin |

### Password Rules

- Minimum 8 characters
- Must match password_confirmation
- Only required when creating user or updating password

### Email Rules

- Must be valid email format
- Must be unique in database
- When updating, current user's email is excluded from unique check

---

## 🐛 Common Errors

### 1. 401 Unauthorized

**Cause:** Token invalid atau tidak ada

**Solution:**
- Login ulang untuk mendapatkan token baru
- Pastikan header Authorization ada dan benar formatnya: `Bearer YOUR_TOKEN`

---

### 2. 422 Validation Failed

**Cause:** Data tidak sesuai validation rules

**Solution:**
- Cek error message untuk detail field mana yang error
- Pastikan semua required fields ada
- Pastikan format email valid
- Pastikan password minimal 8 karakter
- Pastikan password_confirmation sama dengan password
- Pastikan role adalah salah satu dari: siswa, kurikulum, kepala_sekolah, admin

---

### 3. 404 Not Found

**Cause:** User ID tidak ditemukan

**Solution:**
- Cek apakah user dengan ID tersebut ada
- GET /api/users untuk melihat list user beserta ID-nya

---

### 4. Email Already Taken

**Cause:** Email sudah digunakan oleh user lain

**Solution:**
- Gunakan email yang berbeda
- Jika update user, pastikan emailnya unique atau gunakan email yang sama dengan user tersebut

---

## 📱 Android Implementation Notes

### Retrofit Interface

```kotlin
@GET("users")
suspend fun getAllUsers(@Header("Authorization") token: String): Response<UserListResponse>

@POST("users")
suspend fun createUser(
    @Header("Authorization") token: String,
    @Body request: CreateUserRequest
): Response<UserResponse>

@PUT("users/{id}")
suspend fun updateUser(
    @Header("Authorization") token: String,
    @Path("id") userId: Int,
    @Body request: UpdateUserRequest
): Response<UserResponse>

@DELETE("users/{id}")
suspend fun deleteUser(
    @Header("Authorization") token: String,
    @Path("id") userId: Int
): Response<ApiResponse<Any>>
```

### Request Models

```kotlin
data class CreateUserRequest(
    val name: String,
    val email: String,
    val password: String,
    val password_confirmation: String,
    val role: String
)

data class UpdateUserRequest(
    val name: String,
    val email: String,
    val password: String? = null,
    val password_confirmation: String? = null,
    val role: String
)
```

### Response Models

```kotlin
data class UserListResponse(
    val success: Boolean,
    val data: List<UserData>
)

data class UserResponse(
    val success: Boolean,
    val message: String,
    val data: UserData
)

data class UserData(
    val id: Int,
    val name: String,
    val email: String,
    val role: String,
    val email_verified_at: String?,
    val created_at: String,
    val updated_at: String
)
```

---

## 🎯 Testing Checklist

### ✅ GET All Users
- [ ] Berhasil mendapatkan list user
- [ ] Response format sesuai
- [ ] Return 401 jika token invalid

### ✅ POST Create User
- [ ] Berhasil create user dengan data lengkap
- [ ] Return 422 jika email sudah ada
- [ ] Return 422 jika password tidak match
- [ ] Return 422 jika role invalid
- [ ] Return 422 jika required field kosong
- [ ] Return 401 jika token invalid

### ✅ GET Single User
- [ ] Berhasil mendapatkan detail user
- [ ] Return 404 jika user tidak ditemukan
- [ ] Return 401 jika token invalid

### ✅ PUT Update User
- [ ] Berhasil update tanpa mengubah password
- [ ] Berhasil update dengan mengubah password
- [ ] Return 404 jika user tidak ditemukan
- [ ] Return 422 jika validation gagal
- [ ] Return 401 jika token invalid

### ✅ DELETE User
- [ ] Berhasil menghapus user
- [ ] Return 404 jika user tidak ditemukan
- [ ] Return 401 jika token invalid

---

## 📝 Notes

- Password selalu di-hash dengan bcrypt sebelum disimpan
- Password tidak pernah di-return dalam response
- Saat update user, password bersifat optional (jika tidak diisi, password lama tetap digunakan)
- Token harus valid dan belum expired
- Pastikan server Laravel running di `http://127.0.0.1:8000`

---

## 🔗 Related Documentation

- `API_ENDPOINTS_DOCUMENTATION.md` - Complete API reference
- `POSTMAN_TESTING_GUIDE.md` - General Postman testing guide
- `QUICK_START_TOKEN.md` - Quick token acquisition guide
- `CARA_MENDAPATKAN_TOKEN.md` - Detailed authentication guide

---

**Last Updated:** October 11, 2025
