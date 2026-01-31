<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Category Queries ===\n\n";

// Test for each category type
$testCases = [
    ['type' => 'production_house', 'value' => 'Moho Film'],
    ['type' => 'genre', 'value' => 'Drama'],
    ['type' => 'genre', 'value' => 'Thriller'],
];

foreach ($testCases as $test) {
    echo "--- Testing: {$test['type']} = {$test['value']} ---\n";
    
    $query = DB::table('movies');
    
    switch ($test['type']) {
        case 'genre':
            $query->join('movie_genres', 'movies.id', '=', 'movie_genres.movie_id')
                  ->join('genres', 'movie_genres.genre_id', '=', 'genres.id')
                  ->where('genres.name', $test['value']);
            break;
            
        case 'production_house':
            $query->join('movie_production_houses', 'movies.id', '=', 'movie_production_houses.movie_id')
                  ->join('production_houses', 'movie_production_houses.production_house_id', '=', 'production_houses.id')
                  ->where('production_houses.name', $test['value']);
            break;
    }
    
    $movies = $query->select(
        'movies.id',
        'movies.title',
        'movies.release_year',
        'movies.default_poster_path'
    )
    ->distinct()
    ->orderBy('movies.release_year', 'desc')
    ->get();
    
    echo "Found: {$movies->count()} movies\n";
    foreach ($movies as $movie) {
        echo "  - [{$movie->id}] {$movie->title} ({$movie->release_year})\n";
    }
    echo "\n";
}
