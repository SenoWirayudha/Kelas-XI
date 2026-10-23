<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RoleAccountSeeder extends Seeder
{
    /**
     * Seed one manager and one staff account in the same cinema.
     * The admin account is seeded by AdminUserSeeder.
     */
    public function run(): void
    {
        $cinema = DB::table('cinemas')->orderBy('id')->first();

        if (!$cinema) {
            $cinemaId = DB::table('cinemas')->insertGetId([
                'cinema_name' => 'Moview Central',
                'city' => 'Sidoarjo',
                'address' => 'Contoh alamat bioskop',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $cinemaName = 'Moview Central';
        } else {
            $cinemaId = $cinema->id;
            $cinemaName = $cinema->cinema_name;
        }

        $accounts = [
            ['username' => 'Manager Demo', 'email' => 'manager@moview.com', 'role' => 'manager'],
            ['username' => 'Staff Demo', 'email' => 'staff@moview.com', 'role' => 'staff'],
        ];

        foreach ($accounts as $account) {
            if (DB::table('users')->where('email', $account['email'])->exists()) {
                $this->command?->info("{$account['role']} account already exists: {$account['email']}");
                continue;
            }

            DB::table('users')->insert([
                'username' => $account['username'],
                'email' => $account['email'],
                'password' => Hash::make('password123'),
                'role' => $account['role'],
                'status' => 'active',
                'cinema_id' => $cinemaId,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command?->info("{$account['role']} created: {$account['email']} / password123 ({$cinemaName})");
        }
    }
}
