# Backend Aplikasi Monitoring Sekolah

Backend API untuk aplikasi monitoring sekolah yang dibuat dengan Laravel 11 dan dapat disambungkan dengan aplikasi Android.

## Database

- **Database Name**: `db_sekolah`
- **Table**: `users`
- **Columns**:
  - `id` (bigint, primary key, auto increment)
  - `name` (varchar)
  - `email` (varchar, unique)
  - `password` (varchar, hashed)
  - `role` (varchar) - admin, teacher, student, user
  - `email_verified_at` (timestamp, nullable)
  - `remember_token` (varchar, nullable)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

## Setup

### 1. Install Dependencies
```bash
composer install
```

### 2. Configure Environment
Update file `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_sekolah
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Create Database
Buat database `db_sekolah` di MySQL:
```sql
CREATE DATABASE db_sekolah;
```

### 4. Run Migrations
```bash
php artisan migrate
```

### 5. Seed Database (Optional)
```bash
php artisan db:seed --class=UserSeeder
```

### 6. Run Server
```bash
php artisan serve
```

Server akan berjalan di `http://localhost:8000`

## API Endpoints

Base URL: `http://localhost:8000/api`

### Authentication

#### 1. Register
**Endpoint**: `POST /api/register`

**Request Body**:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student"
}
```

**Response** (201):
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "role": "student",
            "created_at": "2025-10-08T10:00:00.000000Z",
            "updated_at": "2025-10-08T10:00:00.000000Z"
        },
        "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
}
```

#### 2. Login
**Endpoint**: `POST /api/login`

**Request Body**:
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response** (200):
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "role": "student",
            "created_at": "2025-10-08T10:00:00.000000Z",
            "updated_at": "2025-10-08T10:00:00.000000Z"
        },
        "token": "2|xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
}
```

#### 3. Get Current User (Protected)
**Endpoint**: `GET /api/user`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2025-10-08T10:00:00.000000Z",
    "updated_at": "2025-10-08T10:00:00.000000Z"
}
```

#### 4. Logout (Protected)
**Endpoint**: `POST /api/logout`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

## User Roles

- `admin` - Administrator sekolah
- `teacher` - Guru/pengajar
- `student` - Siswa
- `user` - User biasa (default)

## Default Users (After Seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@sekolah.com | password123 | admin |
| guru@sekolah.com | password123 | teacher |
| siswa@sekolah.com | password123 | student |

## Testing API dengan Postman

1. **Register/Login** untuk mendapatkan token
2. Salin token dari response
3. Untuk endpoint yang protected, tambahkan header:
   - Key: `Authorization`
   - Value: `Bearer {your_token}`

## Integrasi dengan Android

### Setup Retrofit (Contoh)

```kotlin
// ApiService.kt
interface ApiService {
    @POST("api/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("api/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @GET("api/user")
    suspend fun getUser(@Header("Authorization") token: String): Response<User>
    
    @POST("api/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<LogoutResponse>
}

// Data Classes
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String = "user"
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val data: AuthData
)

data class AuthData(
    val user: User,
    val token: String
)

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val role: String,
    val created_at: String,
    val updated_at: String
)
```

### Contoh Penggunaan

```kotlin
// Login
val loginRequest = LoginRequest("john@example.com", "password123")
val response = apiService.login(loginRequest)

if (response.isSuccessful) {
    val token = response.body()?.data?.token
    val user = response.body()?.data?.user
    // Simpan token ke SharedPreferences
}

// Menggunakan API dengan token
val token = "Bearer ${savedToken}"
val userResponse = apiService.getUser(token)
```

## CORS Configuration

Jika terjadi masalah CORS saat mengakses dari Android, pastikan sudah menginstall dan konfigurasi CORS di Laravel.

## Security Notes

- Token disimpan menggunakan Laravel Sanctum
- Password di-hash menggunakan bcrypt
- Gunakan HTTPS di production
- Jangan expose token di log atau error message

## Tech Stack

- Laravel 11
- Laravel Sanctum (API Authentication)
- MySQL Database
- PHP 8.2+

## License

MIT License
