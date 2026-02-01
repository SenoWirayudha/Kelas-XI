<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Recent Movies (Last 5) ===\n\n";

$movies = DB::table('movies')
    ->leftJoin('movie_media', function($join) {
        $join->on('movies.id', '=', 'movie_media.movie_id')
             ->where('movie_media.media_type', '=', 'poster')
             ->where('movie_media.is_default', '=', 1);
    })
    ->select(
        'movies.id',
        'movies.title',
        'movies.release_year',
        'movies.duration',
        'movies.synopsis',
        'movie_media.media_path as poster_path'
    )
    ->orderBy('movies.id', 'desc')
    ->limit(5)
    ->get();

foreach ($movies as $movie) {
    echo "ID: {$movie->id}\n";
    echo "  Title: " . ($movie->title ?: 'NULL') . "\n";
    echo "  Year: " . ($movie->release_year ?: 'NULL') . "\n";
    echo "  Duration: " . ($movie->duration ?: 'NULL') . " minutes\n";
    echo "  Poster: " . ($movie->poster_path ?: 'NULL') . "\n";
    echo "  Synopsis: " . (substr($movie->synopsis ?: 'NULL', 0, 60)) . "...\n";
    echo "\n";
}

// Check for backdrop
echo "=== Checking backdrop media ===\n\n";
$backdrops = DB::table('movie_media')
    ->where('media_type', 'backdrop')
    ->where('is_default', 1)
    ->orderBy('movie_id', 'desc')
    ->limit(5)
    ->get(['movie_id', 'media_path']);

foreach ($backdrops as $backdrop) {
    echo "Movie ID: {$backdrop->movie_id} - Backdrop: {$backdrop->media_path}\n";
}
