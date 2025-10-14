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
            ['nama_kelas' => '10 IPA 1'],
            ['nama_kelas' => '10 IPA 2'],
            ['nama_kelas' => '10 IPS 1'],
            ['nama_kelas' => '11 IPA 1'],
            ['nama_kelas' => '11 IPA 2'],
            ['nama_kelas' => '11 IPS 1'],
            ['nama_kelas' => '12 IPA 1'],
            ['nama_kelas' => '12 IPS 1'],
        ];

        foreach ($kelasList as $kelas) {
            Kelas::create($kelas);
        }
    }
}
