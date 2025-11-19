<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin
        User::create([
            'name' => 'Admin Sekolah',
            'email' => 'admin@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Kepala Sekolah
        User::create([
            'name' => 'Dr. Budi Santoso',
            'email' => 'kepalasekolah@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'kepala_sekolah',
        ]);
        
        // User Login (Kepala Sekolah alternatif)
        User::create([
            'name' => 'User Login',
            'email' => 'user@sekolah.com',
            'password' => Hash::make('password'),
            'role' => 'kepala_sekolah',
        ]);

        // Kurikulum
        User::create([
            'name' => 'Dra. Siti Nurhaliza',
            'email' => 'kurikulum@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'kurikulum',
        ]);

        // Siswa 1 - Kelas 1 (X RPL 1)
        User::create([
            'name' => 'Ahmad Fauzi',
            'email' => 'siswa1@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'siswa',
            'kelas_id' => 1, // X RPL 1
        ]);

        // Siswa 2 - Kelas 2 (XI RPL 1)
        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siswa2@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'siswa',
            'kelas_id' => 2, // XI RPL 1
        ]);
    }
}
