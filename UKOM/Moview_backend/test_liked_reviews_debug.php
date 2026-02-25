<?php
// Test Liked Reviews for Movie
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Liked Reviews for Movie API ===\n\n";

// Get user IDs and names
$users = DB::table('users')->select('id', 'username', 'display_name')->get();
echo "Available Users:\n";
foreach ($users as $user) {
    echo "- ID: {$user->id}, Username: {$user->username}, Display Name: {$user->display_name}\n";
}
echo "\n";

// Check review_likes table
echo "=== Review Likes Table ===\n";
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
        'reviews.film_id',
        'movies.title as movie_title',
        'reviews.rating',
        'reviews.review_text'
    )
    ->orderBy('review_likes.created_at', 'desc')
    ->get();

if ($reviewLikes->isEmpty()) {
    echo "No review likes found!\n";
} else {
    foreach ($reviewLikes as $like) {
        echo "\nLike Record:\n";
        echo "  Liker: User {$like->liker_id} ({$like->liker_username})\n";
        echo "  Liked Review ID: {$like->review_id}\n";
        echo "  Review by: User {$like->reviewer_id} ({$like->reviewer_username})\n";
        echo "  Movie: {$like->movie_title} (ID: {$like->film_id})\n";
        echo "  Rating: {$like->rating} stars\n";
        echo "  Review: " . substr($like->review_text ?: 'No text', 0, 50) . "\n";
    }
}

echo "\n=== Testing API Query ===\n";

// Test for User ID 3 (Mafia film) - replace with actual user ID
$testUserId = 3;
$testMovieId = null;

// Find movie_id for "Sirât"
$siratMovie = DB::table('movies')->where('title', 'LIKE', '%Sirât%')->orWhere('title', 'LIKE', '%Sirat%')->first();
if ($siratMovie) {
    $testMovieId = $siratMovie->id;
    echo "Found Sirât movie: ID {$testMovieId}\n";
} else {
    echo "Sirât movie not found! Trying to find any movie...\n";
    $anyMovie = DB::table('movies')->first();
    if ($anyMovie) {
        $testMovieId = $anyMovie->id;
        echo "Using movie: {$anyMovie->title} (ID: {$testMovieId})\n";
    }
}

if ($testMovieId) {
    echo "\nTesting getLikedReviewsForMovie($testUserId, $testMovieId):\n";
    
    $likedReviews = DB::table('review_likes')
        ->join('reviews', 'review_likes.review_id', '=', 'reviews.id')
        ->join('users', 'reviews.user_id', '=', 'users.id')
        ->where('review_likes.user_id', $testUserId)
        ->where('reviews.film_id', $testMovieId)
        ->where('reviews.user_id', '!=', $testUserId)
        ->select(
            'reviews.id as review_id',
            'reviews.user_id',
            'users.username',
            'users.display_name',
            'users.profile_photo',
            'reviews.rating'
        )
        ->get();
    
    echo "Query executed. Found " . $likedReviews->count() . " liked reviews.\n";
    
    if ($likedReviews->isEmpty()) {
        echo "\nNo liked reviews found for User $testUserId on Movie $testMovieId\n";
        
        // Debug: Check if user has ANY review likes
        $anyLikes = DB::table('review_likes')->where('user_id', $testUserId)->get();
        echo "\nUser $testUserId has " . $anyLikes->count() . " review likes in total\n";
        
        // Debug: Check reviews for this movie
        $movieReviews = DB::table('reviews')->where('film_id', $testMovieId)->get();
        echo "Movie $testMovieId has " . $movieReviews->count() . " reviews\n";
        
    } else {
        foreach ($likedReviews as $review) {
            echo "\nLiked Review Found:\n";
            echo "  Review ID: {$review->review_id}\n";
            echo "  Reviewer: {$review->display_name} ({$review->username})\n";
            echo "  Rating: {$review->rating} stars\n";
            echo "  Profile Photo: {$review->profile_photo}\n";
        }
    }
}

echo "\n=== End of Test ===\n";
