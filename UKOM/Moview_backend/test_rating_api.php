<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Test getRating
echo "Testing getRating API...\n";

try {
    $userId = 3;
    $movieId = 603;
    
    $rating = DB::table('ratings')
        ->where('user_id', $userId)
        ->where('film_id', $movieId)
        ->first(['rating', 'is_watched', 'created_at', 'updated_at']);
    
    if ($rating) {
        echo "Rating found:\n";
        echo "  Rating: " . $rating->rating . "\n";
        echo "  Is Watched: " . $rating->is_watched . "\n";
        echo "  Created: " . $rating->created_at . "\n";
    } else {
        echo "No rating found for user $userId, movie $movieId\n";
    }
    
    // Check if is_watched column exists
    echo "\nChecking ratings table structure...\n";
    $columns = DB::select("DESCRIBE ratings");
    foreach ($columns as $column) {
        echo "  " . $column->Field . " (" . $column->Type . ")\n";
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
