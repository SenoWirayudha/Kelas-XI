<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Movie;

echo "========================================\n";
echo "CHECKING FOR MOVIES WITH BLANK/NULL DATA\n";
echo "========================================\n\n";

// Get all movies
$movies = Movie::all();

echo "Total movies: " . $movies->count() . "\n\n";

foreach ($movies as $movie) {
    $hasIssue = false;
    $issues = [];
    
    // Check title
    if (empty($movie->title)) {
        $hasIssue = true;
        $issues[] = "Title is empty/null";
    }
    
    // Check poster
    if (empty($movie->default_poster_path)) {
        $hasIssue = true;
        $issues[] = "Poster path is empty/null";
    }
    
    // Check backdrop
    if (empty($movie->default_backdrop_path)) {
        $hasIssue = true;
        $issues[] = "Backdrop path is empty/null";
    }
    
    // Check synopsis
    if (empty($movie->synopsis)) {
        $hasIssue = true;
        $issues[] = "Synopsis is empty/null";
    }
    
    // Check duration
    if (is_null($movie->duration)) {
        $hasIssue = true;
        $issues[] = "Duration is null";
    }
    
    // Check age rating
    if (empty($movie->age_rating)) {
        $hasIssue = true;
        $issues[] = "Age rating is empty/null";
    }
    
    // Check release year
    if (is_null($movie->release_year)) {
        $hasIssue = true;
        $issues[] = "Release year is null";
    }
    
    if ($hasIssue) {
        echo "\n[MOVIE ID: {$movie->id}]\n";
        echo "Title: " . ($movie->title ?? 'NULL') . "\n";
        echo "Issues:\n";
        foreach ($issues as $issue) {
            echo "  - $issue\n";
        }
        echo "\nFull Data:\n";
        echo "  - Poster: " . ($movie->default_poster_path ?? 'NULL') . "\n";
        echo "  - Backdrop: " . ($movie->default_backdrop_path ?? 'NULL') . "\n";
        echo "  - Synopsis: " . (strlen($movie->synopsis ?? '') > 50 ? substr($movie->synopsis, 0, 50) . '...' : ($movie->synopsis ?? 'NULL')) . "\n";
        echo "  - Duration: " . ($movie->duration ?? 'NULL') . "\n";
        echo "  - Age Rating: " . ($movie->age_rating ?? 'NULL') . "\n";
        echo "  - Release Year: " . ($movie->release_year ?? 'NULL') . "\n";
        echo "---\n";
    }
}

echo "\n========================================\n";
echo "CHECK COMPLETE\n";
echo "========================================\n";
