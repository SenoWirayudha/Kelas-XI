<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Find Sengefilm user
$user = DB::table('users')
    ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
    ->where('user_profiles.display_name', 'like', '%Senge%')
    ->orWhere('users.username', 'like', '%senge%')
    ->select('users.id', 'users.username', 'user_profiles.display_name')
    ->first();

if ($user) {
    echo "User ID: {$user->id}, Username: {$user->username}, Display: {$user->display_name}\n";
    
    // Find Sirat movie
    $movie = DB::table('movies')
        ->where('title', 'like', '%Sirat%')
        ->select('id', 'title')
        ->first();
    
    if ($movie) {
        echo "Movie ID: {$movie->id}, Title: {$movie->title}\n";
        
        // Check diaries for this combination
        $diaryCount = DB::table('diaries')
            ->where('user_id', $user->id)
            ->where('film_id', $movie->id)
            ->count();
            
        echo "Diaries: $diaryCount\n";
        
        // Check reviews
        $reviewCount = DB::table('reviews')
            ->where('user_id', $user->id)
            ->where('film_id', $movie->id)
            ->count();
            
        echo "Reviews: $reviewCount\n";
    } else {
        echo "Movie 'Sirat' not found\n";
    }
} else {
    echo "User 'Sengefilm' not found\n";
}
