<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "FIXING MISSING AGE RATINGS\n";
echo "========================================\n\n";

// Update movies without age_rating
$updated = DB::table('movies')
    ->whereNull('age_rating')
    ->orWhere('age_rating', '')
    ->update(['age_rating' => 'Not Rated']);

echo "Updated $updated movies with 'Not Rated' age rating.\n\n";

// Show current status
$movies = DB::table('movies')
    ->select('id', 'title', 'age_rating', 'duration')
    ->orderBy('id', 'desc')
    ->limit(5)
    ->get();

echo "Latest 5 movies:\n";
foreach ($movies as $movie) {
    echo "- ID {$movie->id}: {$movie->title}\n";
    echo "  Age Rating: " . ($movie->age_rating ?? 'NULL') . "\n";
    echo "  Duration: " . ($movie->duration ?? 'NULL') . " minutes\n\n";
}

echo "========================================\n";
echo "DONE\n";
echo "========================================\n";
