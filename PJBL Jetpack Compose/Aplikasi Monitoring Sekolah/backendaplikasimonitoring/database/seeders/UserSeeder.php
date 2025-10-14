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

        // Kurikulum
        User::create([
            'name' => 'Dra. Siti Nurhaliza',
            'email' => 'kurikulum@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'kurikulum',
        ]);

        // Siswa 1
        User::create([
            'name' => 'Ahmad Fauzi',
            'email' => 'siswa1@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'siswa',
        ]);

        // Siswa 2
        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siswa2@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'siswa',
        ]);
    }
}
