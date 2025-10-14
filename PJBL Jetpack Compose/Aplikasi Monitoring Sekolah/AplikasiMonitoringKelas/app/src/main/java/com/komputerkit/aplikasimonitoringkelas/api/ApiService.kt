package com.komputerkit.aplikasimonitoringkelas.api

import com.komputerkit.aplikasimonitoringkelas.api.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication Endpoints
    @POST("register")
    suspend fun register(@Body request: RegisterRequest): Response<LoginResponse>
    
    @POST("login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("logout")
    suspend fun logout(@Header("Authorization") token: String): Response<ApiResponse<Any>>
    
    @GET("user")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    // User Management Endpoints (CRUD)
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
    
    // Kelas Endpoints
    @GET("kelas")
    suspend fun getAllKelas(@Header("Authorization") token: String): Response<KelasListResponse>
    
    // Public Kelas endpoint (no auth required) - untuk dropdown
    @GET("kelas")
    suspend fun getKelas(): KelasListResponse
    
    // Jadwal Endpoints
    @GET("jadwals")
    suspend fun getAllJadwals(@Header("Authorization") token: String): Response<JadwalListResponse>
    
    // Public GET jadwals (no auth) - untuk load di Entri Jadwal screen
    @GET("jadwals")
    suspend fun getJadwals(): JadwalListResponse
    
    @GET("jadwal/schedule/kelas/{kelasId}/hari/{hari}")
    suspend fun getJadwalByKelasAndHari(
        @Header("Authorization") token: String,
        @Path("kelasId") kelasId: Int,
        @Path("hari") hari: String
    ): Response<JadwalListResponse>
    
    // POST jadwal - untuk Entri Jadwal (no auth required)
    @POST("jadwals")
    suspend fun createJadwal(@Body request: CreateJadwalRequest): Response<JadwalResponse>
    
    // Guru Mengajar Endpoints
    @POST("guru-mengajar/by-hari-kelas")
    suspend fun getGuruMengajarByHariKelas(
        @Header("Authorization") token: String,
        @Body request: GuruMengajarByHariKelasRequest
    ): Response<GuruMengajarListResponse>
    
    @POST("guru-mengajars")
    suspend fun createGuruMengajar(
        @Header("Authorization") token: String,
        @Body request: CreateGuruMengajarRequest
    ): Response<GuruMengajarResponse>
    
    @PUT("guru-mengajars/{id}")
    suspend fun updateGuruMengajar(
        @Header("Authorization") token: String,
        @Path("id") id: Int,
        @Body request: UpdateGuruMengajarRequest
    ): Response<GuruMengajarResponse>
    
    @DELETE("guru-mengajars/{id}")
    suspend fun deleteGuruMengajar(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<DeleteResponse>
    
    @POST("guru-mengajar/tidak-masuk")
    suspend fun getGuruTidakMasuk(
        @Header("Authorization") token: String,
        @Body request: GuruMengajarByHariKelasRequest
    ): Response<GuruMengajarListResponse>
    
    // Guru Endpoints
    @GET("gurus")
    suspend fun getAllGurus(@Header("Authorization") token: String): Response<GuruListResponse>
    
    // Public Guru endpoint (no auth required) - untuk dropdown
    @GET("gurus")
    suspend fun getGurus(): GuruListResponse
    
    // Mapel Endpoints
    @GET("mapels")
    suspend fun getAllMapels(@Header("Authorization") token: String): Response<MapelListResponse>
    
    // Public Mapel endpoint (no auth required) - untuk dropdown
    @GET("mapels")
    suspend fun getMapels(): MapelListResponse
    
    // CASCADE FILTER ENDPOINTS FOR GANTI GURU FEATURE
    // Step 1: Get kelas by hari
    @GET("jadwal/cascade/kelas/hari/{hari}")
    suspend fun getKelasByHari(
        @Header("Authorization") token: String,
        @Path("hari") hari: String
    ): Response<KelasListResponse>
    
    // Step 2: Get guru by hari and kelas
    @GET("jadwal/cascade/guru/hari/{hari}/kelas/{kelasId}")
    suspend fun getGuruByHariAndKelas(
        @Header("Authorization") token: String,
        @Path("hari") hari: String,
        @Path("kelasId") kelasId: Int
    ): Response<GuruListResponse>
    
    // Step 3: Get mapel by hari, kelas, and guru
    @GET("jadwal/cascade/mapel/hari/{hari}/kelas/{kelasId}/guru/{guruId}")
    suspend fun getMapelByHariKelasGuru(
        @Header("Authorization") token: String,
        @Path("hari") hari: String,
        @Path("kelasId") kelasId: Int,
        @Path("guruId") guruId: Int
    ): Response<MapelListResponse>
    
    // Step 4: Get jadwal details (includes jam_ke)
    @GET("jadwal/cascade/details/hari/{hari}/kelas/{kelasId}/guru/{guruId}/mapel/{mapelId}")
    suspend fun getJadwalDetails(
        @Header("Authorization") token: String,
        @Path("hari") hari: String,
        @Path("kelasId") kelasId: Int,
        @Path("guruId") guruId: Int,
        @Path("mapelId") mapelId: Int
    ): Response<JadwalDetailResponse>
    
    // Tambahkan endpoint lain sesuai kebutuhan
    // Contoh untuk siswa, jadwal, absen, dll
    
}
