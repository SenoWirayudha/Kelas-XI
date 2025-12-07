<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\GuruMengajar;

class GuruMengajarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $today = now(); // Tanggal hari ini untuk testing kelas kosong
        
        $guruMengajars = [
            // Senin - X-RPL 1
            ['jadwal_id' => 1, 'keterangan' => 'Materi Aljabar', 'status' => 'masuk', 'created_at' => $today, 'updated_at' => $today],
            ['jadwal_id' => 2, 'guru_pengganti_id' => 3, 'keterangan' => 'Mohon perhatian ekstra untuk kelas ini', 'status' => 'tidak_masuk', 'created_at' => $today, 'updated_at' => $today], // Bu Dewi Kusuma menggantikan (TIDAK MUNCUL di kelas kosong karena sudah ada pengganti)
            ['jadwal_id' => 3, 'izin_mulai' => $today, 'izin_selesai' => $today->copy()->addDays(2), 'keterangan' => 'Sakit demam tinggi', 'status' => 'izin', 'created_at' => $today, 'updated_at' => $today], // KELAS KOSONG Senin (belum ada pengganti) ✓ AKAN MUNCUL
            
            // Selasa - X-RPL 1
            ['jadwal_id' => 4, 'keterangan' => 'Grammar and Vocabulary', 'status' => 'masuk', 'created_at' => $today, 'updated_at' => $today],
            ['jadwal_id' => 5, 'izin_mulai' => $today, 'izin_selesai' => $today, 'keterangan' => 'Guru izin dinas luar', 'status' => 'izin', 'created_at' => $today, 'updated_at' => $today], // KELAS KOSONG Selasa (belum ada pengganti) ✓ AKAN MUNCUL
            
            // Rabu - XI-RPL 1
            ['jadwal_id' => 6, 'keterangan' => 'Materi Persamaan Linear', 'status' => 'masuk', 'created_at' => $today, 'updated_at' => $today],
            ['jadwal_id' => 7, 'guru_pengganti_id' => 2, 'keterangan' => 'Lanjutkan materi sebelumnya', 'status' => 'tidak_masuk', 'created_at' => $today, 'updated_at' => $today], // Bu Budi Santoso menggantikan (TIDAK MUNCUL di kelas kosong)
            
            // Kamis - XI-RPL 2
            ['jadwal_id' => 8, 'keterangan' => 'Teks Eksposisi', 'status' => 'masuk', 'created_at' => $today, 'updated_at' => $today],
            ['jadwal_id' => 9, 'izin_mulai' => $today->copy()->addDay(), 'izin_selesai' => $today->copy()->addDays(3), 'keterangan' => 'Guru izin keperluan keluarga', 'status' => 'izin', 'created_at' => $today, 'updated_at' => $today], // KELAS KOSONG Kamis (belum ada pengganti) ✓ AKAN MUNCUL
            
            // Jumat - X-RPL 1
            ['jadwal_id' => 10, 'keterangan' => 'Kesenian Musik Tradisional', 'status' => 'masuk', 'created_at' => $today, 'updated_at' => $today],
        ];

        foreach ($guruMengajars as $data) {
            GuruMengajar::create($data);
        }
    }
}
