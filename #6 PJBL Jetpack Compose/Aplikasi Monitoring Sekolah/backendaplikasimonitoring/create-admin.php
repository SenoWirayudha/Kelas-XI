<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Delete existing users (optional)
// User::query()->delete();

// Create admin user
$user = User::updateOrCreate(
    ['email' => 'admin@admin.com'],
    [
        'name' => 'Admin',
        'password' => Hash::make('password'),
        'role' => 'admin',
        'email_verified_at' => now(),
    ]
);

echo "✅ User created successfully!\n";
echo "Email: admin@admin.com\n";
echo "Password: password\n";
echo "Role: {$user->role}\n";
echo "ID: {$user->id}\n";
