<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check what's in SharedPreferences for user "Tes"
echo "CHECKING USER 'Tes' IN DATABASE\n";
echo "=================================\n\n";

// Find user by username
$user = DB::table('users')->where('username', 'Tes')->first();

if (!$user) {
    echo "ERROR: User 'Tes' not found in users table!\n";
    echo "\nAll users in database:\n";
    $allUsers = DB::table('users')->select('id', 'username', 'email')->get();
    foreach ($allUsers as $u) {
        echo "  ID: {$u->id}, Username: {$u->username}, Email: {$u->email}\n";
    }
    exit;
}

echo "USER FOUND:\n";
echo "  ID: {$user->id}\n";
echo "  Username: {$user->username}\n";
echo "  Email: {$user->email}\n";
echo "  Role: {$user->role}\n";
echo "  Status: {$user->status}\n\n";

// Check if profile exists
$profile = DB::table('user_profiles')->where('user_id', $user->id)->first();

echo "PROFILE STATUS:\n";
if ($profile) {
    echo "  Profile EXISTS\n";
    echo "  Display Name: " . ($profile->display_name ?? 'NULL') . "\n";
    echo "  Bio: " . ($profile->bio ?? 'NULL') . "\n";
    echo "  Location: " . ($profile->location ?? 'NULL') . "\n";
} else {
    echo "  Profile DOES NOT EXIST for user_id: {$user->id}\n";
    echo "  Creating profile now...\n";
    
    // Create profile
    DB::table('user_profiles')->insert([
        'user_id' => $user->id,
        'display_name' => $user->username,
        'profile_photo' => null,
        'backdrop_path' => null,
        'bio' => null,
        'location' => null,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    echo "  Profile created successfully!\n";
    $profile = DB::table('user_profiles')->where('user_id', $user->id)->first();
}

echo "\n=================================\n";
echo "API TEST:\n";
echo "Endpoint: GET http://10.0.2.2:8000/api/v1/users/{$user->id}/profile\n";
echo "Expected username in response: {$user->username}\n";
echo "Expected display_name: " . ($profile->display_name ?? $user->username) . "\n";
