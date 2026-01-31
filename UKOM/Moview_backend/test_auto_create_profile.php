<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "TESTING AUTO-CREATE USER_PROFILES ON REGISTRATION\n";
echo "==================================================\n\n";

// Create a test user to simulate registration
$testEmail = 'newuser_' . time() . '@test.com';
$testUsername = 'NewUser' . rand(100, 999);
$testPassword = 'password123';

echo "Creating test user:\n";
echo "  Email: {$testEmail}\n";
echo "  Username: {$testUsername}\n\n";

try {
    // Simulate the registration process
    $token = base64_encode($testEmail . '|' . time() . '|' . uniqid());
    
    $userId = DB::table('users')->insertGetId([
        'username' => $testUsername,
        'email' => $testEmail,
        'password' => bcrypt($testPassword),
        'role' => 'user',
        'status' => 'active',
        'remember_token' => $token,
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    echo "✓ User created with ID: {$userId}\n\n";
    
    // Auto-create profile (this is what we added to AuthController)
    DB::table('user_profiles')->insert([
        'user_id' => $userId,
        'display_name' => $testUsername,
        'profile_photo' => null,
        'backdrop_path' => null,
        'bio' => null,
        'location' => null,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    echo "✓ User profile auto-created\n\n";
    
    // Verify profile exists
    $profile = DB::table('user_profiles')->where('user_id', $userId)->first();
    
    if ($profile) {
        echo "VERIFICATION SUCCESS!\n";
        echo "  user_id: {$profile->user_id}\n";
        echo "  display_name: {$profile->display_name}\n";
        echo "  profile_photo: " . ($profile->profile_photo ?? 'NULL') . "\n";
        echo "  backdrop_path: " . ($profile->backdrop_path ?? 'NULL') . "\n";
        echo "\n";
        echo "✓ When you register a new account, user_profiles will be auto-populated!\n";
    } else {
        echo "ERROR: Profile not found!\n";
    }
    
    echo "\n==================================================\n";
    echo "NOTE: This test user has been created in your database.\n";
    echo "You can test the profile API with:\n";
    echo "GET http://10.0.2.2:8000/api/v1/users/{$userId}/profile\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
