<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists
        $adminExists = DB::table('users')
            ->where('email', 'admin@moview.com')
            ->exists();
        
        if (!$adminExists) {
            DB::table('users')->insert([
                'username' => 'Admin',
                'email' => 'admin@moview.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $this->command->info('Admin user created successfully!');
            $this->command->info('Email: admin@moview.com');
            $this->command->info('Password: password123');
        } else {
            $this->command->info('Admin user already exists.');
        }
    }
}
