<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Test getLikedReviewsForMovie Query ===\n\n";

// Find User IDs
echo "Finding users...\n";
$users = DB::table('users')
    ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
    ->select('users.id', 'users.username', 'user_profiles.display_name')
    ->get();

foreach ($users as $user) {
    echo "User ID {$user->id}: {$user->username} (display: {$user->display_name})\n";
}

// Check which users created reviews
echo "\n=== Reviews by User ===\n";
$reviewsByUser = DB::table('reviews')
    ->join('users', 'reviews.user_id', '=', 'users.id')
    ->join('movies', 'reviews.film_id', '=', 'movies.id')
    ->select('reviews.id as review_id', 'reviews.user_id', 'users.username', 'movies.title', 'movies.id as movie_id', 'reviews.rating')
    ->get();

foreach ($reviewsByUser as $review) {
    echo "Review #{$review->review_id} by User {$review->user_id} ({$review->username}) for '{$review->title}' (Movie ID {$review->movie_id}) - {$review->rating} stars\n";
}

// Check review likes
echo "\n=== Review Likes ===\n";
$reviewLikes = DB::table('review_likes')
    ->join('reviews', 'review_likes.review_id', '=', 'reviews.id')
    ->join('users as liker', 'review_likes.user_id', '=', 'liker.id')
    ->join('users as reviewer', 'reviews.user_id', '=', 'reviewer.id')
    ->join('movies', 'reviews.film_id', '=', 'movies.id')
    ->select(
        'review_likes.user_id as liker_id',
        'liker.username as liker_username',
        'review_likes.review_id',
        'reviews.user_id as reviewer_id',
        'reviewer.username as reviewer_username',
        'movies.id as movie_id',
        'movies.title as movie_title',
        'reviews.rating'
    )
    ->get();

if ($reviewLikes->isEmpty()) {
    echo "No review likes found!\n";
} else {
    foreach ($reviewLikes as $like) {
        echo "User {$like->liker_id} ({$like->liker_username}) liked Review #{$like->review_id} by User {$like->reviewer_id} ({$like->reviewer_username}) for '{$like->movie_title}' (Movie ID {$like->movie_id})\n";
    }
}

// Now test the actual query for each user/movie combination
echo "\n=== Testing getLikedReviewsForMovie Query ===\n";
foreach ($reviewLikes as $like) {
    echo "\nTesting: User {$like->liker_id} ({$like->liker_username}) and Movie {$like->movie_id} ('{$like->movie_title}')\n";
    
    $result = DB::table('review_likes')
        ->join('reviews', 'review_likes.review_id', '=', 'reviews.id')
        ->join('users', 'reviews.user_id', '=', 'users.id')
        ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
        ->where('review_likes.user_id', $like->liker_id)
        ->where('reviews.film_id', $like->movie_id)
        ->where('reviews.user_id', '!=', $like->liker_id)
        ->select(
            'reviews.id as review_id',
            'reviews.user_id',
            'users.username',
            'user_profiles.display_name',
            'user_profiles.profile_photo',
            'reviews.rating'
        )
        ->get();
    
    if ($result->isEmpty()) {
        echo "  ❌ No results found!\n";
    } else {
        echo "  ✅ Found {$result->count()} liked review(s):\n";
        foreach ($result as $review) {
            echo "      - Review #{$review->review_id} by User {$review->user_id} ({$review->username}/{$review->display_name}) - {$review->rating} stars\n";
            echo "        Profile Photo: {$review->profile_photo}\n";
        }
    }
}

echo "\n=== End of Test ===\n";
