<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=== User Verification ===\n\n";

$user = User::where('email', 'admin@admin.com')->first();

if ($user) {
    echo "✅ User found!\n";
    echo "Name: {$user->name}\n";
    echo "Email: {$user->email}\n";
    echo "Role: {$user->role}\n";
    echo "ID: {$user->id}\n";
    
    // Test password
    if (\Illuminate\Support\Facades\Hash::check('password', $user->password)) {
        echo "✅ Password is correct!\n";
    } else {
        echo "❌ Password is incorrect!\n";
    }
    
    // Test canAccessPanel
    try {
        $panel = new stdClass();
        $canAccess = $user->canAccessPanel($panel);
        echo "Can access panel: " . ($canAccess ? "✅ YES" : "❌ NO") . "\n";
    } catch (\Exception $e) {
        echo "Error testing canAccessPanel: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ User not found!\n";
    echo "\nAll users:\n";
    foreach (User::all() as $u) {
        echo "- {$u->email} (Role: {$u->role})\n";
    }
}
