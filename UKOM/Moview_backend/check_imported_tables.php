<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== CHECKING IMPORTED TABLES ===\n\n";

$expectedTables = [
    'movies', 'movie_media', 'genres', 'movie_genres',
    'production_houses', 'movie_production_houses',
    'countries', 'movie_countries',
    'languages', 'movie_languages',
    'services', 'movie_services',
    'persons', 'movie_persons'
];

foreach ($expectedTables as $table) {
    try {
        $count = DB::table($table)->count();
        echo "✓ $table: $count records\n";
    } catch (\Exception $e) {
        echo "✗ $table: NOT FOUND\n";
    }
}

echo "\n=== Sample Data ===\n";
echo "Movies: " . DB::table('movies')->pluck('title')->implode(', ') . "\n";
echo "Genres: " . DB::table('genres')->pluck('name')->take(5)->implode(', ') . "...\n";
echo "Countries: " . DB::table('countries')->pluck('name')->take(5)->implode(', ') . "...\n";
