<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== Ratings dalam 7 hari terakhir ===" . PHP_EOL;
$ratings = DB::table('ratings')
    ->join('movies', 'ratings.film_id', '=', 'movies.id')
    ->select('ratings.film_id', 'movies.title', 'ratings.created_at', 'ratings.user_id')
    ->whereBetween('ratings.created_at', [
        Carbon::now()->subWeek(),
        Carbon::now()
    ])
    ->orderBy('ratings.created_at', 'desc')
    ->get();

foreach($ratings as $r) {
    echo "Film: {$r->title} (ID: {$r->film_id}), User: {$r->user_id}, Date: {$r->created_at}" . PHP_EOL;
}

echo PHP_EOL . "=== Count per film ===" . PHP_EOL;
$counts = DB::table('ratings')
    ->join('movies', 'ratings.film_id', '=', 'movies.id')
    ->select('movies.id', 'movies.title', DB::raw('COUNT(*) as total'))
    ->whereBetween('ratings.created_at', [
        Carbon::now()->subWeek(),
        Carbon::now()
    ])
    ->groupBy('movies.id', 'movies.title')
    ->orderBy('total', 'desc')
    ->get();

foreach($counts as $c) {
    echo "Film: {$c->title} (ID: {$c->id}), Total: {$c->total}" . PHP_EOL;
}

echo PHP_EOL . "=== Views per day (last 7 days) ===" . PHP_EOL;
for ($i = 6; $i >= 0; $i--) {
    $targetDate = Carbon::now()->subDays($i);
    $count = DB::table('ratings')
        ->whereDate('created_at', $targetDate->format('Y-m-d'))
        ->count();
    echo "{$targetDate->format('M d (Y-m-d)')}: {$count} views" . PHP_EOL;
}
