<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Checking diary entries for duplicates...\n\n";
    
    $userId = 3; // Ganti dengan user ID yang mengalami duplikasi
    
    // Get raw diary data
    $diaries = DB::table('diaries')
        ->where('user_id', $userId)
        ->select('id', 'film_id', 'watched_at', 'is_rewatched', 'note', 'created_at')
        ->orderBy('film_id')
        ->orderBy('created_at')
        ->get();
    
    echo "Total diary entries for user $userId: " . $diaries->count() . "\n\n";
    
    // Group by film_id
    $byFilm = $diaries->groupBy('film_id');
    
    foreach ($byFilm as $filmId => $entries) {
        if ($entries->count() > 1) {
            echo "Film ID: $filmId - " . $entries->count() . " entries\n";
            echo str_repeat("-", 80) . "\n";
            foreach ($entries as $entry) {
                echo sprintf(
                    "  Diary ID: %-3d | Watched: %s | Rewatch: %d | Note: %s\n",
                    $entry->id,
                    $entry->watched_at,
                    $entry->is_rewatched,
                    substr($entry->note ?? 'NULL', 0, 30)
                );
            }
            echo "\n";
        }
    }
    
    // Check for potential join issues
    echo "\nChecking query result (same as API response)...\n\n";
    
    $apiResult = DB::table('diaries')
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
        ->select(
            'diaries.id as diary_id',
            'diaries.film_id',
            'movies.title',
            'diaries.watched_at',
            'diaries.is_rewatched'
        )
        ->orderBy('diaries.film_id')
        ->orderBy('diaries.created_at')
        ->get();
    
    echo "API Query Result Count: " . $apiResult->count() . "\n\n";
    
    $grouped = $apiResult->groupBy('film_id');
    foreach ($grouped as $filmId => $entries) {
        if ($entries->count() > 1) {
            echo "Film ID: $filmId - " . $entries->count() . " entries (POTENTIAL DUPLICATE!)\n";
            foreach ($entries as $entry) {
                echo "  Diary ID: {$entry->diary_id} | Title: {$entry->title} | Rewatch: {$entry->is_rewatched}\n";
            }
            echo "\n";
        }
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
