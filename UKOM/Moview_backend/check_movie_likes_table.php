<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "CHECKING MOVIE_LIKES TABLE\n";
echo "========================================\n\n";

// Check if table exists
$tables = DB::select('SHOW TABLES');
$databaseName = DB::getDatabaseName();

$tableExists = false;
foreach ($tables as $table) {
    $tableName = $table->{"Tables_in_$databaseName"};
    if ($tableName === 'movie_likes') {
        $tableExists = true;
        break;
    }
}

if ($tableExists) {
    echo "✅ Table 'movie_likes' exists\n\n";
    
    // Show structure
    echo "Table Structure:\n";
    $columns = DB::select("DESCRIBE movie_likes");
    foreach ($columns as $col) {
        echo "- {$col->Field} ({$col->Type}) " . ($col->Null === 'NO' ? 'NOT NULL' : 'NULL') . "\n";
    }
    
    // Show count
    $count = DB::table('movie_likes')->count();
    echo "\nTotal records: $count\n";
    
    // Show sample data
    if ($count > 0) {
        echo "\nSample data:\n";
        $samples = DB::table('movie_likes')->limit(5)->get();
        foreach ($samples as $like) {
            echo "- User {$like->user_id} likes Film {$like->film_id}\n";
        }
    }
} else {
    echo "❌ Table 'movie_likes' does NOT exist\n\n";
    echo "Creating table...\n";
    
    DB::statement("
        CREATE TABLE movie_likes (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            film_id BIGINT UNSIGNED NOT NULL,
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL,
            UNIQUE KEY unique_user_film (user_id, film_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (film_id) REFERENCES movies(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo "✅ Table created successfully\n";
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
