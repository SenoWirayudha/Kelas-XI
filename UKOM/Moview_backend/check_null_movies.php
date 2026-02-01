<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Checking for movies with NULL values ===\n\n";

// Check for NULL titles
$nullTitles = DB::table('movies')->whereNull('title')->get(['id', 'title', 'release_year']);
echo "Movies with NULL title: " . $nullTitles->count() . "\n";
if ($nullTitles->count() > 0) {
    foreach ($nullTitles as $movie) {
        echo "  - ID: {$movie->id}, Title: NULL, Year: {$movie->release_year}\n";
    }
}

// Check for NULL or empty poster/backdrop
$nullMedia = DB::table('movies')
    ->select('id', 'title', 'release_year', 'duration', 'synopsis')
    ->whereNotExists(function($query) {
        $query->select(DB::raw(1))
              ->from('movie_media')
              ->whereColumn('movie_media.movie_id', 'movies.id')
              ->where('movie_media.media_type', 'poster')
              ->where('movie_media.is_default', 1);
    })
    ->get();

echo "\nMovies WITHOUT default poster: " . $nullMedia->count() . "\n";
if ($nullMedia->count() > 0) {
    foreach ($nullMedia as $movie) {
        echo "  - ID: {$movie->id}, Title: " . ($movie->title ?? 'NULL') . ", Year: {$movie->release_year}\n";
        echo "    Duration: " . ($movie->duration ?? 'NULL') . ", Synopsis: " . (substr($movie->synopsis ?? 'NULL', 0, 50)) . "...\n";
    }
}

// Check for NULL duration
$nullDuration = DB::table('movies')->whereNull('duration')->get(['id', 'title', 'release_year', 'duration']);
echo "\nMovies with NULL duration: " . $nullDuration->count() . "\n";
if ($nullDuration->count() > 0) {
    foreach ($nullDuration as $movie) {
        echo "  - ID: {$movie->id}, Title: {$movie->title}, Year: {$movie->release_year}\n";
    }
}

// Check for empty synopsis
$nullSynopsis = DB::table('movies')->whereNull('synopsis')->orWhere('synopsis', '')->get(['id', 'title']);
echo "\nMovies with NULL/empty synopsis: " . $nullSynopsis->count() . "\n";
if ($nullSynopsis->count() > 0) {
    foreach ($nullSynopsis->take(5) as $movie) {
        echo "  - ID: {$movie->id}, Title: {$movie->title}\n";
    }
    if ($nullSynopsis->count() > 5) {
        echo "  ... and " . ($nullSynopsis->count() - 5) . " more\n";
    }
}

echo "\n=== Summary ===\n";
echo "Total movies: " . DB::table('movies')->count() . "\n";
echo "Movies with issues: " . ($nullTitles->count() + $nullMedia->count() + $nullDuration->count()) . "\n";
