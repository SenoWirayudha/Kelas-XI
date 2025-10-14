<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GuruController;
use App\Http\Controllers\MapelController;
use App\Http\Controllers\TahunAjaranController;
use App\Http\Controllers\KelasController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\GuruMengajarController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public endpoints (no authentication required)
// User Management Routes - untuk Admin Panel list users
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);

// Kelas endpoint - untuk spinner/dropdown
Route::get('/kelas', [KelasController::class, 'index']);

// Mapel endpoint - untuk spinner/dropdown Entri Jadwal
Route::get('/mapels', [MapelController::class, 'index']);

// Guru endpoint - untuk spinner/dropdown Entri Jadwal
Route::get('/gurus', [GuruController::class, 'index']);

// Jadwal endpoints - untuk Daftar Jadwal screens
Route::get('/jadwals', [JadwalController::class, 'index']); // Get all jadwals
Route::get('/jadwal/schedule/kelas/{kelasId}/hari/{hari}', [JadwalController::class, 'getByKelasAndHari']);
Route::get('/jadwals/kelas/{kelasId}/hari/{hari}', [JadwalController::class, 'getByKelasAndHari']);
Route::get('/jadwals/hari/{hari}/kelas/{kelasId}', [JadwalController::class, 'getDetailByHariAndKelas']);
// POST jadwal endpoint - untuk Entri Jadwal form
Route::post('/jadwals', [JadwalController::class, 'store']);

// CASCADE FILTER ROUTES - untuk Ganti Guru feature
Route::get('/jadwal/cascade/kelas/hari/{hari}', [JadwalController::class, 'getKelasByHari']);
Route::get('/jadwal/cascade/guru/hari/{hari}/kelas/{kelasId}', [JadwalController::class, 'getGuruByHariAndKelas']);
Route::get('/jadwal/cascade/mapel/hari/{hari}/kelas/{kelasId}/guru/{guruId}', [JadwalController::class, 'getMapelByHariKelasGuru']);
Route::get('/jadwal/cascade/details/hari/{hari}/kelas/{kelasId}/guru/{guruId}/mapel/{mapelId}', [JadwalController::class, 'getJadwalDetails']);

// Guru Mengajar endpoints - untuk ListKurikulumScreen & Ganti Guru
Route::post('/guru-mengajar/by-hari-kelas', [GuruMengajarController::class, 'getByHariKelasPost']);
Route::post('/guru-mengajar/tidak-masuk', [GuruMengajarController::class, 'getGuruTidakMasukPost']);
Route::get('/guru-mengajars/hari/{hari}/kelas/{kelasId}', [GuruMengajarController::class, 'getByHariAndKelas']);
Route::get('/guru-mengajars/tidak-masuk/hari/{hari}/kelas/{kelasId}', [GuruMengajarController::class, 'getGuruTidakMasuk']);
Route::post('/guru-mengajars', [GuruMengajarController::class, 'store']); // Create guru mengajar with jadwal_id
Route::post('/guru-mengajars/by-jadwal', [GuruMengajarController::class, 'storeByJadwalParams']); // Alternative with params
Route::put('/guru-mengajars/by-jadwal', [GuruMengajarController::class, 'updateByJadwalParams']);
Route::put('/guru-mengajars/{guruMengajar}', [GuruMengajarController::class, 'update']);
Route::delete('/guru-mengajars/{guruMengajar}', [GuruMengajarController::class, 'destroy']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // API Resource Routes (inside auth middleware) - only POST/PUT/DELETE methods
    // GET methods moved to public endpoints above
    Route::post('/gurus', [GuruController::class, 'store']);
    Route::get('/gurus/{guru}', [GuruController::class, 'show']);
    Route::put('/gurus/{guru}', [GuruController::class, 'update']);
    Route::delete('/gurus/{guru}', [GuruController::class, 'destroy']);
    
    Route::post('/mapels', [MapelController::class, 'store']);
    Route::get('/mapels/{mapel}', [MapelController::class, 'show']);
    Route::put('/mapels/{mapel}', [MapelController::class, 'update']);
    Route::delete('/mapels/{mapel}', [MapelController::class, 'destroy']);
    
    Route::apiResource('tahun-ajarans', TahunAjaranController::class);
    // Kelas GET already moved to public, but keep other methods here
    Route::post('/kelas', [KelasController::class, 'store']);
    Route::get('/kelas/{kelas}', [KelasController::class, 'show']);
    Route::put('/kelas/{kelas}', [KelasController::class, 'update']);
    Route::delete('/kelas/{kelas}', [KelasController::class, 'destroy']);
    
    // Jadwal routes - only PUT/DELETE need auth, GET/POST already public
    Route::get('/jadwals/{jadwal}', [JadwalController::class, 'show']);
    Route::put('/jadwals/{jadwal}', [JadwalController::class, 'update']);
    Route::delete('/jadwals/{jadwal}', [JadwalController::class, 'destroy']);
    
    // Note: Custom Jadwal and Guru Mengajar routes moved to public endpoints above
    
    // Resource route untuk guru-mengajars (CRUD standar) - only if needed with auth
    Route::get('/guru-mengajars', [GuruMengajarController::class, 'index']);
});
