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
            // Senin - Kelas X-RPL 1 (ID: 1)
            ['guru_id' => 1, 'mapel_id' => 1, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '1-2', 'hari' => 'Senin'],
            ['guru_id' => 2, 'mapel_id' => 2, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '3-4', 'hari' => 'Senin'],
            ['guru_id' => 3, 'mapel_id' => 4, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '5-6', 'hari' => 'Senin'],
            
            // Selasa - Kelas X-RPL 1 (ID: 1)
            ['guru_id' => 4, 'mapel_id' => 5, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '1-2', 'hari' => 'Selasa'],
            ['guru_id' => 5, 'mapel_id' => 6, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '3-4', 'hari' => 'Selasa'],
            
            // Rabu - Kelas XI-RPL 1 (ID: 2)
            ['guru_id' => 1, 'mapel_id' => 1, 'tahun_ajaran_id' => 2, 'kelas_id' => 2, 'jam_ke' => '1-2', 'hari' => 'Rabu'],
            ['guru_id' => 2, 'mapel_id' => 2, 'tahun_ajaran_id' => 2, 'kelas_id' => 2, 'jam_ke' => '3-4', 'hari' => 'Rabu'],
            
            // Kamis - Kelas XI-RPL 2 (ID: 3)
            ['guru_id' => 3, 'mapel_id' => 3, 'tahun_ajaran_id' => 2, 'kelas_id' => 3, 'jam_ke' => '1-2', 'hari' => 'Kamis'],
            ['guru_id' => 4, 'mapel_id' => 4, 'tahun_ajaran_id' => 2, 'kelas_id' => 3, 'jam_ke' => '3-4', 'hari' => 'Kamis'],
            
            // Jumat - Kelas X-RPL 1 (ID: 1)
            ['guru_id' => 5, 'mapel_id' => 7, 'tahun_ajaran_id' => 2, 'kelas_id' => 1, 'jam_ke' => '1-2', 'hari' => 'Jumat'],
        ];

        foreach ($jadwals as $jadwal) {
            Jadwal::create($jadwal);
        }
    }
}
