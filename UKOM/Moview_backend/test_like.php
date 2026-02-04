<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "TESTING LIKE FUNCTIONALITY\n";
echo "========================================\n\n";

$userId = 3;
$movieId = 8; // The Handmaiden

echo "Testing toggleLike for User $userId, Movie $movieId\n\n";

try {
    // Check if already liked
    $existingLike = DB::table('movie_likes')
        ->where('user_id', $userId)
        ->where('film_id', $movieId)
        ->first();
    
    if ($existingLike) {
        echo "Already liked - Removing like...\n";
        DB::table('movie_likes')
            ->where('user_id', $userId)
            ->where('film_id', $movieId)
            ->delete();
        echo "✅ Like removed\n";
    } else {
        echo "Not liked yet - Adding like...\n";
        
        // Check column structure
        $columns = DB::select("DESCRIBE movie_likes");
        echo "Columns: ";
        foreach ($columns as $col) {
            echo $col->Field . " ";
        }
        echo "\n";
        
        DB::table('movie_likes')->insert([
            'user_id' => $userId,
            'film_id' => $movieId,
            'created_at' => now()
        ]);
        echo "✅ Like added\n";
    }
    
    // Verify
    $count = DB::table('movie_likes')
        ->where('user_id', $userId)
        ->where('film_id', $movieId)
        ->count();
    
    echo "\nFinal status: " . ($count > 0 ? "LIKED" : "NOT LIKED") . "\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
