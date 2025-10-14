<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Jadwal;

class JadwalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jadwals = [
            // Senin - Kelas 10 IPA 1
            ['guru_id' => 1, 'mapel_id' => 1, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '1-2', 'hari' => 'Senin'],
            ['guru_id' => 2, 'mapel_id' => 2, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '3-4', 'hari' => 'Senin'],
            ['guru_id' => 3, 'mapel_id' => 4, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '5-6', 'hari' => 'Senin'],
            
            // Selasa - Kelas 10 IPA 1
            ['guru_id' => 4, 'mapel_id' => 5, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '1-2', 'hari' => 'Selasa'],
            ['guru_id' => 5, 'mapel_id' => 6, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '3-4', 'hari' => 'Selasa'],
            
            // Rabu - Kelas 10 IPA 2
            ['guru_id' => 1, 'mapel_id' => 1, 'tahun_ajaran_id' => 2, 'kelas_id' => 2, 'jam_ke' => '1-2', 'hari' => 'Rabu'],
            ['guru_id' => 2, 'mapel_id' => 2, 'tahun_ajaran_id' => 2, 'kelas_id' => 2, 'jam_ke' => '3-4', 'hari' => 'Rabu'],
            
            // Kamis - Kelas 11 IPA 1
            ['guru_id' => 3, 'mapel_id' => 3, 'tahun_ajaran_id' => 2, 'kelas_id' => 4, 'jam_ke' => '1-2', 'hari' => 'Kamis'],
            ['guru_id' => 4, 'mapel_id' => 4, 'tahun_ajaran_id' => 2, 'kelas_id' => 4, 'jam_ke' => '3-4', 'hari' => 'Kamis'],
            
            // Jumat - Kelas 12 IPA 1
            ['guru_id' => 5, 'mapel_id' => 7, 'tahun_ajaran_id' => 2, 'kelas_id' => 7, 'jam_ke' => '1-2', 'hari' => 'Jumat'],
        ];

        foreach ($jadwals as $jadwal) {
            Jadwal::create($jadwal);
        }
    }
}
