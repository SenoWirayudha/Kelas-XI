<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Testing review save...\n";

// Check table structure
echo "\n1. Reviews table structure:\n";
$columns = DB::select("SHOW COLUMNS FROM reviews");
foreach ($columns as $column) {
    echo "  - {$column->Field}: {$column->Type}\n";
}

// Try to insert a review
echo "\n2. Attempting to insert review...\n";
try {
    $userId = 3;
    $filmId = 27;
    $reviewText = "Test review from PHP";
    $rating = 5;
    $containsSpoilers = 0;
    
    // Check if exists
    $existing = DB::table('reviews')
        ->where('user_id', $userId)
        ->where('film_id', $filmId)
        ->first();
    
    if ($existing) {
        echo "  - Review already exists, updating...\n";
        DB::table('reviews')
            ->where('user_id', $userId)
            ->where('film_id', $filmId)
            ->update([
                'review' => $reviewText,
                'rating' => $rating,
                'contains_spoilers' => $containsSpoilers,
                'updated_at' => now()
            ]);
    } else {
        echo "  - Creating new review...\n";
        DB::table('reviews')->insert([
            'user_id' => $userId,
            'film_id' => $filmId,
            'review' => $reviewText,
            'rating' => $rating,
            'contains_spoilers' => $containsSpoilers,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    
    echo "  ✓ Review saved successfully\n";
    
    // Verify
    $saved = DB::table('reviews')
        ->where('user_id', $userId)
        ->where('film_id', $filmId)
        ->first();
    
    echo "\n3. Saved review:\n";
    echo json_encode($saved, JSON_PRETTY_PRINT) . "\n";
    
} catch (\Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}
