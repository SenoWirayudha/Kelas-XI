<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Guru;

class GuruSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $gurus = [
            ['kode_guru' => 'GR001', 'nama_guru' => 'Budi Santoso', 'telepon' => '081234567890'],
            ['kode_guru' => 'GR002', 'nama_guru' => 'Siti Nurhaliza', 'telepon' => '082345678901'],
            ['kode_guru' => 'GR003', 'nama_guru' => 'Ahmad Fauzi', 'telepon' => '083456789012'],
            ['kode_guru' => 'GR004', 'nama_guru' => 'Dewi Lestari', 'telepon' => '084567890123'],
            ['kode_guru' => 'GR005', 'nama_guru' => 'Rudi Hermawan', 'telepon' => '085678901234'],
        ];

        foreach ($gurus as $guru) {
            Guru::create($guru);
        }
    }
}
