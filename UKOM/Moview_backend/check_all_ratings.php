<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== ALL Ratings for film_id 34 (Sirāt) ===" . PHP_EOL;
$ratings34 = DB::table('ratings')
    ->where('film_id', 34)
    ->select('id', 'user_id', 'rating', 'created_at')
    ->orderBy('created_at', 'desc')
    ->get();

foreach($ratings34 as $r) {
    echo "ID: {$r->id}, User: {$r->user_id}, Rating: {$r->rating}, Date: {$r->created_at}" . PHP_EOL;
}

echo PHP_EOL . "=== ALL Ratings for film_id 10 (Sentimental Value) ===" . PHP_EOL;
$ratings10 = DB::table('ratings')
    ->where('film_id', 10)
    ->select('id', 'user_id', 'rating', 'created_at')
    ->orderBy('created_at', 'desc')
    ->get();

foreach($ratings10 as $r) {
    echo "ID: {$r->id}, User: {$r->user_id}, Rating: {$r->rating}, Date: {$r->created_at}" . PHP_EOL;
}

echo PHP_EOL . "=== ALL Ratings for film_id 37 (A Separation) ===" . PHP_EOL;
$ratings37 = DB::table('ratings')
    ->where('film_id', 37)
    ->select('id', 'user_id', 'rating', 'created_at')
    ->orderBy('created_at', 'desc')
    ->get();

foreach($ratings37 as $r) {
    echo "ID: {$r->id}, User: {$r->user_id}, Rating: {$r->rating}, Date: {$r->created_at}" . PHP_EOL;
}

echo PHP_EOL . "=== Top 5 Films by Total Ratings (all time) ===" . PHP_EOL;
$topAll = DB::table('ratings')
    ->join('movies', 'ratings.film_id', '=', 'movies.id')
    ->select('movies.id', 'movies.title', DB::raw('COUNT(*) as total'))
    ->groupBy('movies.id', 'movies.title')
    ->orderBy('total', 'desc')
    ->limit(5)
    ->get();

foreach($topAll as $film) {
    echo "Film: {$film->title} (ID: {$film->id}), Total: {$film->total} ratings" . PHP_EOL;
}
