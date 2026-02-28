<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Movie;
use App\Models\Rating;

echo "Updating movie ratings from ratings table...\n\n";

$movies = Movie::all();
$updated = 0;

foreach ($movies as $movie) {
    $totalRatings = $movie->ratings()->count();
    $avgRating = $totalRatings > 0 ? $movie->ratings()->avg('rating') : 0;
    
    if ($movie->rating_average != $avgRating || $movie->total_reviews != $totalRatings) {
        $oldAvg = $movie->rating_average ?? 0;
        $oldTotal = $movie->total_reviews ?? 0;
        
        $movie->rating_average = $avgRating;
        $movie->total_reviews = $totalRatings;
        $movie->save();
        
        echo "Movie ID {$movie->id} ({$movie->title}):\n";
        echo "  Old: {$oldAvg}/5 ({$oldTotal} ratings)\n";
        echo "  New: " . number_format($avgRating, 2) . "/5 ({$totalRatings} ratings)\n\n";
        
        $updated++;
    }
}

echo "\n=================================\n";
echo "Total movies updated: {$updated}\n";
echo "Total movies checked: {$movies->count()}\n";
echo "=================================\n";
