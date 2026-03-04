<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing User 5 Friends Activity ===\n\n";

$userId = 5;

// Check user 5
$user = DB::table('users')->where('id', $userId)->first();
echo "User ID 5: " . ($user ? $user->username : 'NOT FOUND') . "\n\n";

// Check who user 5 follows
echo "User 5 follows:\n";
$following = DB::table('followers')
    ->join('users', 'followers.user_id', '=', 'users.id')
    ->where('followers.follower_id', $userId)
    ->select('users.id', 'users.username')
    ->get();

if ($following->isEmpty()) {
    echo "  User 5 doesn't follow anyone!\n\n";
} else {
    foreach ($following as $f) {
        echo "  - User ID {$f->id}: {$f->username}\n";
    }
    echo "\n";
}

// Get followed user IDs
$followedUserIds = DB::table('followers')
    ->where('follower_id', $userId)
    ->pluck('user_id')
    ->toArray();

echo "Followed User IDs: " . implode(', ', $followedUserIds) . "\n\n";

if (!empty($followedUserIds)) {
    // Check diaries
    echo "=== Diaries from followed users ===\n";
    $diaries = DB::table('diaries')
        ->join('users', 'diaries.user_id', '=', 'users.id')
        ->join('movies', 'diaries.film_id', '=', 'movies.id')
        ->whereIn('diaries.user_id', $followedUserIds)
        ->select('diaries.id', 'users.username', 'movies.title', 'diaries.rating', 'diaries.watched_at')
        ->orderBy('diaries.watched_at', 'desc')
        ->get();
    
    if ($diaries->isEmpty()) {
        echo "  No diaries found\n";
    } else {
        foreach ($diaries as $d) {
            echo "  Diary ID {$d->id}: {$d->username} watched '{$d->title}' - Rating: {$d->rating}\n";
        }
    }
    echo "\n";
    
    // Check reviews
    echo "=== Reviews from followed users ===\n";
    $reviews = DB::table('reviews')
        ->join('users', 'reviews.user_id', '=', 'users.id')
        ->join('movies', 'reviews.film_id', '=', 'movies.id')
        ->whereIn('reviews.user_id', $followedUserIds)
        ->whereIn('reviews.status', ['published', 'flagged'])
        ->select('reviews.id', 'users.username', 'movies.title', 'reviews.rating', 'reviews.created_at')
        ->orderBy('reviews.created_at', 'desc')
        ->get();
    
    if ($reviews->isEmpty()) {
        echo "  No reviews found\n";
    } else {
        foreach ($reviews as $r) {
            echo "  Review ID {$r->id}: {$r->username} reviewed '{$r->title}' - Rating: {$r->rating}\n";
        }
    }
    echo "\n";
}

echo "=== Testing API Endpoint ===\n";
// Simulate API call
try {
    $response = app('App\Http\Controllers\Api\V1\UserActivityController')->getFriendsRecentActivity($userId);
    $data = json_decode($response->getContent(), true);
    
    echo "API Response Success: " . ($data['success'] ? 'YES' : 'NO') . "\n";
    echo "Number of activities: " . count($data['data']) . "\n\n";
    
    if (!empty($data['data'])) {
        echo "Activities returned:\n";
        foreach ($data['data'] as $activity) {
            echo "  - {$activity['activity_type']}: {$activity['user']['username']} - {$activity['movie']['title']}\n";
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
