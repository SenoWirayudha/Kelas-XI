<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Create fresh admin user
$user = User::updateOrCreate(
    ['email' => 'admin@sekolah.com'],
    [
        'name' => 'Administrator',
        'password' => Hash::make('admin123'),
        'role' => 'admin',
        'email_verified_at' => now(),
        'kelas_id' => null,
    ]
);

echo "✅ Admin user created/updated successfully!\n";
echo "\n";
echo "=== LOGIN CREDENTIALS ===\n";
echo "URL: http://127.0.0.1:8000/admin/login\n";
echo "Email: admin@sekolah.com\n";
echo "Password: admin123\n";
echo "=========================\n";
echo "\n";
echo "User Details:\n";
echo "ID: {$user->id}\n";
echo "Name: {$user->name}\n";
echo "Email: {$user->email}\n";
echo "Role: {$user->role}\n";

// Verify password
if (Hash::check('admin123', $user->password)) {
    echo "✅ Password verification: PASSED\n";
} else {
    echo "❌ Password verification: FAILED\n";
}
