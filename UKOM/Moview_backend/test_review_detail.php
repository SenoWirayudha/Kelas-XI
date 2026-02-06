<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Testing review detail API...\n";

try {
    $userId = 3;
    $reviewId = 2;
    
    $review = DB::table('reviews')
        ->join('movies', 'reviews.film_id', '=', 'movies.id')
        ->join('users', 'reviews.user_id', '=', 'users.id')
        ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
        ->leftJoin('movie_media as poster', function($join) {
            $join->on('movies.id', '=', 'poster.movie_id')
                 ->where('poster.media_type', '=', 'poster')
                 ->where('poster.is_default', '=', 1);
        })
        ->leftJoin('movie_media as backdrop', function($join) {
            $join->on('movies.id', '=', 'backdrop.movie_id')
                 ->where('backdrop.media_type', '=', 'backdrop')
                 ->where('backdrop.is_default', '=', 1);
        })
        ->where('reviews.id', $reviewId)
        ->where('reviews.status', 'published')
        ->select(
            'reviews.id as review_id',
            'reviews.user_id',
            'reviews.film_id as movie_id',
            'reviews.rating',
            'reviews.content as review_text',
            'reviews.created_at',
            'movies.id',
            'movies.title',
            'movies.release_year as year',
            'poster.media_path as poster_path',
            'backdrop.media_path as backdrop_path',
            'users.username',
            'user_profiles.display_name',
            'user_profiles.profile_photo'
        )
        ->first();
    
    echo "Review Detail:\n";
    echo json_encode($review, JSON_PRETTY_PRINT) . "\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
