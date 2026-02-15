<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Follow Status ===\n\n";

$currentUserId = 5; // Your account
$targetUserId = 3; // Sengefilm

echo "Current User ID: $currentUserId\n";
echo "Target User ID: $targetUserId\n\n";

// Check all followers table data
echo "=== All Followers Table Data ===\n";
$allFollowers = DB::table('followers')->get();
foreach ($allFollowers as $row) {
    echo "ID: {$row->id}, user_id: {$row->user_id}, follower_id: {$row->follower_id}\n";
}
echo "\n";

// Test isFollowing query
echo "=== Testing isFollowing Query ===\n";
echo "Query: WHERE user_id=$targetUserId AND follower_id=$currentUserId\n";

$isFollowing = DB::table('followers')
    ->where('user_id', $targetUserId)
    ->where('follower_id', $currentUserId)
    ->exists();

echo "Result: " . ($isFollowing ? 'TRUE (Following)' : 'FALSE (Not Following)') . "\n\n";

// Get the actual row if exists
$row = DB::table('followers')
    ->where('user_id', $targetUserId)
    ->where('follower_id', $currentUserId)
    ->first();

if ($row) {
    echo "Found row:\n";
    echo "  id: {$row->id}\n";
    echo "  user_id: {$row->user_id}\n";
    echo "  follower_id: {$row->follower_id}\n";
    echo "  created_at: {$row->created_at}\n";
} else {
    echo "No row found!\n";
}

echo "\n=== Test Complete ===\n";
