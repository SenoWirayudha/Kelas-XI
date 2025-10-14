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
        // Seed Users first (already exists)
        $this->call(UserSeeder::class);
        
        // Seed other tables
        $this->call([
            GuruSeeder::class,
            MapelSeeder::class,
            TahunAjaranSeeder::class,
            KelasSeeder::class,
            JadwalSeeder::class,
            GuruMengajarSeeder::class,
        ]);
    }
}
