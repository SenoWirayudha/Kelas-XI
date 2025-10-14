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
        $guruMengajars = [
            ['jadwal_id' => 1, 'keterangan' => 'Materi Aljabar', 'status' => 'masuk'],
            ['jadwal_id' => 2, 'keterangan' => 'Praktikum Fisika', 'status' => 'masuk'],
            ['jadwal_id' => 3, 'keterangan' => 'Latihan Menulis Esai', 'status' => 'masuk'],
            ['jadwal_id' => 4, 'keterangan' => 'Grammar and Vocabulary', 'status' => 'masuk'],
            ['jadwal_id' => 5, 'keterangan' => 'Olahraga Futsal', 'status' => 'masuk'],
            ['jadwal_id' => 1, 'keterangan' => 'Guru Izin Sakit', 'status' => 'tidak_masuk'],
            ['jadwal_id' => 3, 'keterangan' => 'Materi Puisi', 'status' => 'masuk'],
        ];

        foreach ($guruMengajars as $data) {
            GuruMengajar::create($data);
        }
    }
}
