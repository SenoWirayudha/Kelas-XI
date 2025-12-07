<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Kelas;

class KelasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kelasList = [
            ['nama_kelas' => 'X-RPL 1'],
            ['nama_kelas' => 'XI-RPL 1'],
            ['nama_kelas' => 'XII-RPL 1'],
        ];

        foreach ($kelasList as $kelas) {
            Kelas::create($kelas);
        }
    }
}
