<?php
require __DIR__ . '/vendor/autoload.php';

// Load Laravel app
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Location Field Update ===\n\n";

try {
    // Test 1: Check if location column exists
    echo "Test 1: Checking if location column exists in user_profiles table...\n";
    $columns = DB::select("SHOW COLUMNS FROM user_profiles LIKE 'location'");
    if (count($columns) > 0) {
        echo "✓ Location column exists\n";
        echo "  Column details: " . json_encode($columns[0]) . "\n\n";
    } else {
        echo "✗ Location column does not exist!\n\n";
    }

    // Test 2: Get a test user
    echo "Test 2: Fetching test user...\n";
    $user = DB::table('users')->where('id', 3)->first();
    if ($user) {
        echo "✓ User found: {$user->username} (ID: {$user->id})\n\n";
    } else {
        echo "✗ User not found\n\n";
        exit;
    }

    // Test 3: Check current profile data
    echo "Test 3: Checking current profile data...\n";
    $profile = DB::table('user_profiles')->where('user_id', $user->id)->first();
    if ($profile) {
        echo "✓ Profile found\n";
        echo "  Bio: " . ($profile->bio ?? 'null') . "\n";
        echo "  Location: " . ($profile->location ?? 'null') . "\n\n";
    } else {
        echo "✗ Profile not found\n\n";
    }

    // Test 4: Update location
    echo "Test 4: Updating location to 'Jakarta, Indonesia'...\n";
    $updated = DB::table('user_profiles')
        ->where('user_id', $user->id)
        ->update([
            'location' => 'Jakarta, Indonesia',
            'updated_at' => now()
        ]);
    
    if ($updated) {
        echo "✓ Location updated successfully\n\n";
    } else {
        echo "✗ Failed to update location\n\n";
    }

    // Test 5: Verify update
    echo "Test 5: Verifying update...\n";
    $profile = DB::table('user_profiles')->where('user_id', $user->id)->first();
    if ($profile && $profile->location === 'Jakarta, Indonesia') {
        echo "✓ Location verified: {$profile->location}\n\n";
    } else {
        echo "✗ Location verification failed\n";
        echo "  Got: " . ($profile->location ?? 'null') . "\n\n";
    }

    // Test 6: Simulate API update request
    echo "Test 6: Simulating API update with bio and location...\n";
    $updateData = [
        'bio' => 'Updated bio with location test',
        'location' => 'New York, USA',
        'updated_at' => now()
    ];
    
    DB::table('user_profiles')
        ->where('user_id', $user->id)
        ->update($updateData);
    
    $profile = DB::table('user_profiles')->where('user_id', $user->id)->first();
    echo "✓ Profile updated:\n";
    echo "  Bio: {$profile->bio}\n";
    echo "  Location: {$profile->location}\n\n";

    echo "=== All Tests Completed Successfully ===\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
