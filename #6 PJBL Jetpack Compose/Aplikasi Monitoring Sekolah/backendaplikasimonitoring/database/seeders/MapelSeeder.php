<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Mapel;

class MapelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mapels = [
            ['kode_mapel' => 'MAT', 'nama_mapel' => 'Matematika'],
            ['kode_mapel' => 'IPA', 'nama_mapel' => 'Ilmu Pengetahuan Alam'],
            ['kode_mapel' => 'IPS', 'nama_mapel' => 'Ilmu Pengetahuan Sosial'],
            ['kode_mapel' => 'BIN', 'nama_mapel' => 'Bahasa Indonesia'],
            ['kode_mapel' => 'BING', 'nama_mapel' => 'Bahasa Inggris'],
            ['kode_mapel' => 'PJOK', 'nama_mapel' => 'Pendidikan Jasmani'],
            ['kode_mapel' => 'SBK', 'nama_mapel' => 'Seni Budaya'],
        ];

        foreach ($mapels as $mapel) {
            Mapel::create($mapel);
        }
    }
}
