<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Test getUserFilmActivity endpoint logic
// Get userId and filmId from command line or use defaults
$userId = $argv[1] ?? 1; // Default user ID  
$filmId = $argv[2] ?? 1;  // Default film ID

echo "Testing getUserFilmActivity for userId=$userId, filmId=$filmId\n\n";

// Get movie info
$movie = DB::table('movies')
    ->leftJoin('movie_media', function($join) {
        $join->on('movies.id', '=', 'movie_media.movie_id')
             ->where('movie_media.media_type', '=', 'poster')
             ->where('movie_media.is_default', '=', 1);
    })
    ->where('movies.id', $filmId)
    ->select(
        'movies.id',
        'movies.title',
        'movies.release_year as year',
        'movie_media.media_path as poster_path'
    )
    ->first();

if (!$movie) {
    echo "Movie not found!\n";
    exit(1);
}

echo "Movie: {$movie->title} ({$movie->year})\n";

// Get user info
$user = DB::table('users')
    ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
    ->where('users.id', $userId)
    ->select(
        'users.id',
        'users.username',
        'user_profiles.display_name'
    )
    ->first();

if (!$user) {
    echo "User not found!\n";
    exit(1);
}

$displayName = $user->display_name ?: $user->username;
echo "User: $displayName (username: {$user->username})\n\n";

// Get all diary entries for this film
$diaries = DB::table('diaries')
    ->leftJoin('reviews', function($join) {
        $join->on('diaries.review_id', '=', 'reviews.id');
    })
    ->leftJoin('ratings', function($join) use ($userId) {
        $join->on('diaries.film_id', '=', 'ratings.film_id')
             ->where('ratings.user_id', '=', $userId);
    })
    ->where('diaries.user_id', $userId)
    ->where('diaries.film_id', $filmId)
    ->select(
        'diaries.id as diary_id',
        'diaries.film_id',
        'diaries.watched_at',
        'diaries.note',
        'diaries.is_rewatched',
        'diaries.created_at',
        'reviews.id as review_id',
        DB::raw('COALESCE(reviews.rating, diaries.rating, ratings.rating) as rating'),
        'reviews.content as review_content',
        DB::raw('COALESCE(reviews.is_liked, diaries.is_liked) as is_liked'),
        DB::raw('CASE WHEN reviews.content IS NOT NULL THEN "review" ELSE "log" END as type')
    )
    ->orderBy('diaries.watched_at', 'desc')
    ->orderBy('diaries.created_at', 'desc')
    ->get();

echo "Diaries found: " . $diaries->count() . "\n";
foreach ($diaries as $diary) {
    echo "  - Diary #{$diary->diary_id}: {$diary->watched_at} (type: {$diary->type}, rating: {$diary->rating})\n";
}

// Get all reviews for this film (that might not be linked to diary)
$reviews = DB::table('reviews')
    ->leftJoin('diaries', function($join) use ($userId) {
        $join->on('reviews.id', '=', 'diaries.review_id')
             ->where('diaries.user_id', '=', $userId);
    })
    ->where('reviews.user_id', $userId)
    ->where('reviews.film_id', $filmId)
    ->where('reviews.status', 'published')
    ->whereNull('diaries.id') // Only get reviews not linked to diary
    ->select(
        'reviews.id as review_id',
        'reviews.film_id',
        'reviews.rating',
        'reviews.is_liked',
        'reviews.watched_at',
        'reviews.title as review_title',
        'reviews.content',
        'reviews.is_spoiler',
        'reviews.created_at',
        'reviews.updated_at'
    )
    ->orderBy('reviews.created_at', 'desc')
    ->get();

echo "\nReviews (standalone, not linked to diary): " . $reviews->count() . "\n";
foreach ($reviews as $review) {
    echo "  - Review #{$review->review_id}: " . ($review->review_title ?: '(no title)') . " (rating: {$review->rating})\n";
}

echo "\n✅ Test complete!\n";
