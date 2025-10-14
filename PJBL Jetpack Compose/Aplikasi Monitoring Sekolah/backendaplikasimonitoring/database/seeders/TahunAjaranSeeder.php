<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TahunAjaran;

class TahunAjaranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tahunAjarans = [
            ['tahun' => '2023/2024', 'flag' => 0],
            ['tahun' => '2024/2025', 'flag' => 1],
            ['tahun' => '2025/2026', 'flag' => 0],
        ];

        foreach ($tahunAjarans as $tahun) {
            TahunAjaran::create($tahun);
        }
    }
}
