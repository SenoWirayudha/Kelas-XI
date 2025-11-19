<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@admin.com')->first();

if ($user) {
    // Reset password dengan hash baru
    $user->password = Hash::make('password');
    $user->role = 'admin';
    $user->email_verified_at = now();
    $user->save();
    
    echo "✅ Password reset successfully!\n";
    echo "Email: admin@admin.com\n";
    echo "Password: password\n";
    echo "Role: {$user->role}\n";
    
    // Test password
    if (Hash::check('password', $user->password)) {
        echo "✅ Password verification: OK\n";
    } else {
        echo "❌ Password verification: FAILED\n";
    }
} else {
    echo "❌ User not found!\n";
}
