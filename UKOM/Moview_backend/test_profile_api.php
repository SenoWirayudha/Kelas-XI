<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get user by ID
$userId = 2; // ID user dari login

echo "Testing Profile API for User ID: {$userId}\n";
echo "==============================================\n\n";

try {
    // Check if user exists
    $user = DB::table('users')->where('id', $userId)->first();
    
    if (!$user) {
        echo "ERROR: User not found!\n";
        echo "Creating test user...\n";
        
        // Create test user if not exists
        DB::table('users')->insert([
            'username' => 'testuser',
            'email' => 'test@moview.com',
            'password' => bcrypt('password123'),
            'role' => 'user',
            'status' => 'active',
            'joined_at' => now()
        ]);
        
        $userId = DB::getPdo()->lastInsertId();
        $user = DB::table('users')->where('id', $userId)->first();
        echo "Test user created with ID: {$userId}\n\n";
    }
    
    echo "USER DATA:\n";
    echo "  ID: {$user->id}\n";
    echo "  Username: {$user->username}\n";
    echo "  Email: {$user->email}\n";
    echo "  Role: {$user->role}\n";
    echo "  Status: {$user->status}\n\n";
    
    // Check user profile
    $profile = DB::table('user_profiles')->where('user_id', $userId)->first();
    
    echo "PROFILE DATA:\n";
    if ($profile) {
        echo "  Display Name: " . ($profile->display_name ?? 'NULL') . "\n";
        echo "  Bio: " . ($profile->bio ?? 'NULL') . "\n";
        echo "  Location: " . ($profile->location ?? 'NULL') . "\n";
        echo "  Profile Photo: " . ($profile->profile_photo ?? 'NULL') . "\n";
        echo "  Backdrop: " . ($profile->backdrop_path ?? 'NULL') . "\n";
    } else {
        echo "  No profile record found for this user.\n";
        echo "  Username will be used as display_name: {$user->username}\n";
    }
    
    echo "\n";
    
    // Check favorites
    echo "FAVORITES:\n";
    $favorites = DB::table('user_favorite_films')
        ->where('user_id', $userId)
        ->orderBy('position')
        ->get();
    
    if ($favorites->isEmpty()) {
        echo "  No favorites found.\n";
    } else {
        foreach ($favorites as $fav) {
            echo "  Position {$fav->position}: Film ID {$fav->film_id}\n";
        }
    }
    
    echo "\n";
    
    // Check statistics
    echo "STATISTICS:\n";
    $filmsCount = DB::table('user_watched_films')->where('user_id', $userId)->count();
    $reviewsCount = DB::table('user_reviews')->where('user_id', $userId)->count();
    $followersCount = DB::table('user_follows')->where('following_id', $userId)->count();
    $followingCount = DB::table('user_follows')->where('follower_id', $userId)->count();
    
    echo "  Films: {$filmsCount}\n";
    echo "  Reviews: {$reviewsCount}\n";
    echo "  Followers: {$followersCount}\n";
    echo "  Following: {$followingCount}\n";
    
    echo "\n==============================================\n";
    echo "API Endpoint: GET http://10.0.2.2:8000/api/v1/users/{$userId}/profile\n";
    echo "Expected display_name: " . ($profile && $profile->display_name ? $profile->display_name : $user->username) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
