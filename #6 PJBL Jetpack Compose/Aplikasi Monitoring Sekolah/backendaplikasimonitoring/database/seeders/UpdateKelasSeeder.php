<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateKelasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update data kelas dengan format yang benar
        // X RPL 1, X RPL 2, X RPL 3, XI RPL 1, XI RPL 2, XI RPL 3, XII RPL 1, XII RPL 2
        
        $kelasMapping = [
            1 => 'X RPL',      // was: 10 IPA 1
            2 => 'XI RPL',     // was: 10 IPA 2
            3 => 'XII RPL',    // was: 10 IPS 1
            4 => 'X RPL',      // was: 11 IPA 1
            5 => 'XI RPL',     // was: 11 IPA 2
            6 => 'XII RPL',    // was: 11 IPS 1
            7 => 'X RPL',      // was: 12 IPA 1
            8 => 'XI RPL',     // was: 12 IPS 1
        ];
        
        foreach ($kelasMapping as $id => $namaBaru) {
            $kelas = DB::table('kelas')->where('id', $id)->first();
            
            if ($kelas) {
                DB::table('kelas')
                    ->where('id', $id)
                    ->update([
                        'nama_kelas' => $namaBaru,
                        'updated_at' => now(),
                    ]);
                
                $this->command->info("Updated ID $id: {$kelas->nama_kelas} -> $namaBaru");
            }
        }
        
        $this->command->info('Kelas data updated successfully!');
    }
}
