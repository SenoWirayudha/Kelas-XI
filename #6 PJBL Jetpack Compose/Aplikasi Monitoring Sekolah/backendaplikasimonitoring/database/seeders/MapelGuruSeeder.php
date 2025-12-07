<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MapelGuruSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data
        DB::table('mapels')->delete();
        DB::table('gurus')->delete();
        
        // Insert Mapel data
        $mapelData = [
            ['nama_mapel' => 'IPA', 'kode_mapel' => 'IPA'],
            ['nama_mapel' => 'IPS', 'kode_mapel' => 'IPS'],
            ['nama_mapel' => 'Bahasa', 'kode_mapel' => 'BHS'],
            ['nama_mapel' => 'Matematika', 'kode_mapel' => 'MTK'],
            ['nama_mapel' => 'Bahasa Inggris', 'kode_mapel' => 'BIG'],
            ['nama_mapel' => 'Bahasa Indonesia', 'kode_mapel' => 'BIN'],
            ['nama_mapel' => 'Pendidikan Agama', 'kode_mapel' => 'PAI'],
            ['nama_mapel' => 'PKN', 'kode_mapel' => 'PKN'],
            ['nama_mapel' => 'Seni Budaya', 'kode_mapel' => 'SBD'],
            ['nama_mapel' => 'PJOK', 'kode_mapel' => 'PJK'],
        ];
        
        foreach ($mapelData as $mapel) {
            DB::table('mapels')->insert([
                'nama_mapel' => $mapel['nama_mapel'],
                'kode_mapel' => $mapel['kode_mapel'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        $this->command->info('Inserted ' . count($mapelData) . ' mapel records');
        
        // Insert Guru data
        $guruData = [
            ['nama_guru' => 'Siti', 'kode_guru' => 'STI'],
            ['nama_guru' => 'Budi', 'kode_guru' => 'BDI'],
            ['nama_guru' => 'Adi', 'kode_guru' => 'ADI'],
            ['nama_guru' => 'Agus', 'kode_guru' => 'AGS'],
            ['nama_guru' => 'Rina', 'kode_guru' => 'RIN'],
            ['nama_guru' => 'Doni', 'kode_guru' => 'DNI'],
            ['nama_guru' => 'Maya', 'kode_guru' => 'MAY'],
            ['nama_guru' => 'Eko', 'kode_guru' => 'EKO'],
            ['nama_guru' => 'Fitri', 'kode_guru' => 'FTR'],
            ['nama_guru' => 'Hendra', 'kode_guru' => 'HND'],
        ];
        
        foreach ($guruData as $guru) {
            DB::table('gurus')->insert([
                'nama_guru' => $guru['nama_guru'],
                'kode_guru' => $guru['kode_guru'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        $this->command->info('Inserted ' . count($guruData) . ' guru records');
        $this->command->info('Mapel and Guru data seeded successfully!');
    }
}
