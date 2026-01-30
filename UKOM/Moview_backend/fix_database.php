<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== FIXING DATABASE ===\n\n";

// Check which tables exist
$tables = DB::select("SHOW TABLES");
$existingTables = array_map(function($table) {
    $key = 'Tables_in_apimoview';
    return $table->$key;
}, $tables);

echo "Existing tables: " . count($existingTables) . "\n";
foreach ($existingTables as $table) {
    echo "  - $table\n";
}

// Drop problematic tables if they exist
$problematicTables = [
    'user_favorite_films',
    'ratings',
    'diaries',
    'watchlists',
    'followers',
    'user_activities',
    'reviews',
    'review_likes',
    'review_comments'
];

echo "\n=== Dropping problematic tables ===\n";
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
foreach ($problematicTables as $table) {
    if (in_array($table, $existingTables)) {
        DB::statement("DROP TABLE IF EXISTS `$table`");
        echo "Dropped: $table\n";
    }
}
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "\n=== Done! Now run: php artisan migrate ===\n";
