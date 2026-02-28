<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "Current time: " . Carbon::now() . PHP_EOL;
echo "7 days ago: " . Carbon::now()->subWeek() . PHP_EOL;
echo PHP_EOL;

$topFilms = DB::table('ratings')
    ->join('movies', 'ratings.film_id', '=', 'movies.id')
    ->select(
        'movies.id',
        'movies.title',
        DB::raw('COUNT(*) as view_count')
    )
    ->whereBetween('ratings.created_at', [
        Carbon::now()->subWeek(),
        Carbon::now()
    ])
    ->groupBy('movies.id', 'movies.title')
    ->orderBy('view_count', 'desc')
    ->limit(5)
    ->get();

echo "=== Top Films This Week (Controller Output) ===" . PHP_EOL;
foreach($topFilms as $film) {
    echo "Film: {$film->title} (ID: {$film->id}), Views: {$film->view_count}" . PHP_EOL;
}

echo PHP_EOL . "=== Views Over Time (Controller Output) ===" . PHP_EOL;
for ($i = 6; $i >= 0; $i--) {
    $targetDate = Carbon::now()->subDays($i);
    $count = DB::table('ratings')
        ->whereDate('created_at', $targetDate->format('Y-m-d'))
        ->count();
    echo "{$targetDate->format('M d')}: {$count} views" . PHP_EOL;
}
