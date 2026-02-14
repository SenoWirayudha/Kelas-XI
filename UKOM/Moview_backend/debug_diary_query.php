<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $userId = 3;
    
    echo "Testing getDiary query step by step...\n\n";
    
    // Step 1: Just diaries
    echo "Step 1: Just diaries table\n";
    $step1 = DB::table('diaries')
        ->where('user_id', $userId)
        ->select('id', 'film_id')
        ->get();
    echo "Count: " . $step1->count() . "\n\n";
    
    // Step 2: With movies join
    echo "Step 2: Diaries + Movies\n";
    $step2 = DB::table('diaries')
        ->join('movies', 'diaries.film_id', '=', 'movies.id')
        ->where('diaries.user_id', $userId)
        ->select('diaries.id as diary_id', 'diaries.film_id', 'movies.title')
        ->get();
    echo "Count: " . $step2->count() . "\n\n";
    
    // Step 3: With poster join
    echo "Step 3: Diaries + Movies + Poster\n";
    $step3 = DB::table('diaries')
        ->join('movies', 'diaries.film_id', '=', 'movies.id')
        ->leftJoin('movie_media as poster_media', function($join) {
            $join->on('movies.id', '=', 'poster_media.movie_id')
                 ->where('poster_media.media_type', '=', 'poster')
                 ->where('poster_media.is_default', '=', 1);
        })
        ->where('diaries.user_id', $userId)
        ->select('diaries.id as diary_id', 'diaries.film_id', 'movies.title')
        ->get();
    echo "Count: " . $step3->count() . "\n";
    
    // Check which films have multiple posters
    echo "\nFilms with potential duplicate posters:\n";
    $posters = DB::table('movie_media')
        ->where('media_type', 'poster')
        ->select('movie_id', DB::raw('COUNT(*) as poster_count'))
        ->groupBy('movie_id')
        ->having('poster_count', '>', 1)
        ->get();
    
    foreach ($posters as $p) {
        echo "Movie ID {$p->movie_id}: {$p->poster_count} posters\n";
        
        $details = DB::table('movie_media')
            ->where('movie_id', $p->movie_id)
            ->where('media_type', 'poster')
            ->select('id', 'is_default', 'media_path')
            ->get();
        
        foreach ($details as $d) {
            echo "  - ID: {$d->id}, Default: {$d->is_default}\n";
        }
    }
    
    echo "\n\nStep 4: Full query (with reviews join)\n";
    $step4 = DB::table('diaries')
        ->join('movies', 'diaries.film_id', '=', 'movies.id')
        ->leftJoin('movie_media as poster_media', function($join) {
            $join->on('movies.id', '=', 'poster_media.movie_id')
                 ->where('poster_media.media_type', '=', 'poster')
                 ->where('poster_media.is_default', '=', 1);
        })
        ->leftJoin('reviews', function($join) {
            $join->on('diaries.review_id', '=', 'reviews.id');
        })
        ->where('diaries.user_id', $userId)
        ->select('diaries.id as diary_id', 'diaries.film_id', 'movies.title', 'reviews.id as review_id')
        ->get();
    echo "Count: " . $step4->count() . "\n\n";
    
    // Check for diary entries with same review_id
    $grouped = $step4->groupBy('diary_id');
    foreach ($grouped as $diaryId => $entries) {
        if ($entries->count() > 1) {
            echo "Diary ID $diaryId appears {$entries->count()} times!\n";
        }
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
