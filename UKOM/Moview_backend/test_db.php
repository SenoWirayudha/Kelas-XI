<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Testing database queries...\n\n";

// Test 1: Check production houses
echo "=== Production Houses ===\n";
$productionHouses = DB::table('production_houses')->get();
foreach ($productionHouses as $ph) {
    echo "ID: {$ph->id}, Name: {$ph->name}\n";
}

echo "\n=== Testing 'Moho Film' ===\n";
$mohoFilm = DB::table('production_houses')->where('name', 'Moho Film')->first();
if ($mohoFilm) {
    echo "Moho Film found! ID: {$mohoFilm->id}\n";
    
    // Get movies for Moho Film
    $movies = DB::table('movies')
        ->join('movie_production_houses', 'movies.id', '=', 'movie_production_houses.movie_id')
        ->join('production_houses', 'movie_production_houses.production_house_id', '=', 'production_houses.id')
        ->where('production_houses.name', 'Moho Film')
        ->select('movies.id', 'movies.title', 'movies.year')
        ->get();
    
    echo "Movies count: " . $movies->count() . "\n";
    foreach ($movies as $movie) {
        echo "  - [{$movie->id}] {$movie->title} ({$movie->year})\n";
    }
} else {
    echo "Moho Film NOT found in production_houses table\n";
}

echo "\n=== Test Full Query (like API) ===\n";
$query = DB::table('movies')
    ->join('movie_production_houses', 'movies.id', '=', 'movie_production_houses.movie_id')
    ->join('production_houses', 'movie_production_houses.production_house_id', '=', 'production_houses.id')
    ->where('production_houses.name', 'Moho Film')
    ->select('movies.id', 'movies.title', 'movies.year', 'movies.poster_path')
    ->distinct()
    ->orderBy('movies.year', 'desc');

echo "SQL: " . $query->toSql() . "\n";
$results = $query->get();
echo "Results count: " . $results->count() . "\n";
