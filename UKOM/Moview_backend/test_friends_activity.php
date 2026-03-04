<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Friends Activity Endpoint ===\n\n";

// Get a user with followers
$user = DB::table('followers')
    ->select('follower_id')
    ->groupBy('follower_id')
    ->havingRaw('COUNT(*) > 0')
    ->first();

if (!$user) {
    echo "No users with followers found. Creating test data...\n";
    exit;
}

$userId = $user->follower_id;
echo "Testing with User ID: $userId\n\n";

// Get list of users that current user follows
$followedUserIds = DB::table('followers')
    ->where('follower_id', $userId)
    ->pluck('user_id')
    ->toArray();

echo "Followed Users: " . implode(', ', $followedUserIds) . "\n\n";

if (empty($followedUserIds)) {
    echo "User $userId doesn't follow anyone.\n";
    exit;
}

// Execute the query
$activities = DB::select("
    SELECT 
        activity_id,
        activity_type,
        user_id,
        username,
        display_name,
        profile_photo,
        film_id as movie_id,
        title,
        poster_path,
        rating,
        is_rewatched,
        has_review,
        review_id,
        diary_id,
        timestamp,
        like_count
    FROM (
        SELECT 
            d.id as activity_id,
            'diary' as activity_type,
            u.id as user_id,
            u.username,
            up.display_name,
            up.profile_photo,
            d.film_id,
            m.title,
            mm.media_path as poster_path,
            d.rating,
            d.is_rewatched,
            false as has_review,
            0 as review_id,
            d.id as diary_id,
            UNIX_TIMESTAMP(d.watched_at) as timestamp,
            0 as like_count,
            ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY d.watched_at DESC) as rn
        FROM diaries d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN movies m ON d.film_id = m.id
        LEFT JOIN movie_media mm ON m.id = mm.movie_id AND mm.media_type = 'poster'
        WHERE d.user_id IN (" . implode(',', array_map('intval', $followedUserIds)) . ")
        
        UNION ALL
        
        SELECT 
            r.id as activity_id,
            'review' as activity_type,
            u.id as user_id,
            u.username,
            up.display_name,
            up.profile_photo,
            r.film_id,
            m.title,
            mm.media_path as poster_path,
            r.rating,
            r.is_rewatched,
            true as has_review,
            r.id as review_id,
            0 as diary_id,
            UNIX_TIMESTAMP(r.created_at) as timestamp,
            0 as like_count,
            ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY r.created_at DESC) as rn
        FROM reviews r
        INNER JOIN users u ON r.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN movies m ON r.film_id = m.id
        LEFT JOIN movie_media mm ON m.id = mm.movie_id AND mm.media_type = 'poster'
        WHERE r.user_id IN (" . implode(',', array_map('intval', $followedUserIds)) . ")
        AND r.status IN ('published', 'flagged')
    ) as combined_activities
    WHERE rn = 1
    ORDER BY timestamp DESC
");

echo "Found " . count($activities) . " activities:\n\n";

foreach ($activities as $activity) {
    echo "ID: {$activity->activity_id}\n";
    echo "Type: {$activity->activity_type}\n";
    echo "User: {$activity->username} (ID: {$activity->user_id})\n";
    echo "Movie: {$activity->title} (ID: {$activity->movie_id})\n";
    echo "Rating: {$activity->rating}\n";
    echo "Is Rewatch: " . ($activity->is_rewatched ? 'Yes' : 'No') . "\n";
    echo "Has Review: " . ($activity->has_review ? 'Yes' : 'No') . "\n";
    echo "Review ID: {$activity->review_id}\n";
    echo "Diary ID: {$activity->diary_id}\n";
    echo "Timestamp: {$activity->timestamp}\n";
    echo "Like Count: {$activity->like_count}\n";
    echo "---\n\n";
}

echo "\n=== Test Complete ===\n";
