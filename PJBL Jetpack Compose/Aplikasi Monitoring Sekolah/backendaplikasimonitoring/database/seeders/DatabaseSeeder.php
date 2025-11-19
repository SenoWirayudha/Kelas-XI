<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed data master first
        $this->call([
            GuruSeeder::class,
            MapelSeeder::class,
            TahunAjaranSeeder::class,
            KelasSeeder::class, // Kelas harus di-seed sebelum User (karena foreign key)
        ]);
        
        // Seed Users (depends on Kelas)
        $this->call(UserSeeder::class);
        
        // Seed relational data
        $this->call([
            JadwalSeeder::class,
            GuruMengajarSeeder::class,
        ]);
    }
}
