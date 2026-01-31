<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Check users table structure
echo "=== users Table Schema ===\n";
$columns = DB::select("DESCRIBE users");
foreach ($columns as $column) {
    echo "{$column->Field} ({$column->Type})\n";
}

echo "\n=== Existing Users ===\n";
$users = DB::table('users')->get();
foreach ($users as $user) {
    echo "ID: {$user->id}, Username: {$user->username}, Email: {$user->email}\n";
}

// Create a test user if not exists
echo "\n=== Creating Test User ===\n";
$testEmail = 'user@moview.com';
$existingUser = DB::table('users')->where('email', $testEmail)->first();

if (!$existingUser) {
    DB::table('users')->insert([
        'username' => 'testuser',
        'email' => $testEmail,
        'password' => Hash::make('password123'),
        'role' => 'user',
        'status' => 'active',
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "✓ User created: {$testEmail} / password123\n";
} else {
    echo "✓ User already exists: {$testEmail}\n";
    
    // Update password to ensure it's correct
    DB::table('users')
        ->where('email', $testEmail)
        ->update([
            'password' => Hash::make('password123'),
            'updated_at' => now()
        ]);
    echo "✓ Password updated for {$testEmail}\n";
}

echo "\n=== All Users ===\n";
$allUsers = DB::table('users')->get(['id', 'username', 'email', 'created_at']);
foreach ($allUsers as $user) {
    echo "ID: {$user->id}, Username: {$user->username}, Email: {$user->email}, Created: {$user->created_at}\n";
}
