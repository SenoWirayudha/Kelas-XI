<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== FIXING DATABASE ===\n\n";

// Check which tables exist
$tables = DB::select("SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
$existingTables = array_map(function($table) {
    return $table->name;
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
foreach ($problematicTables as $table) {
    if (in_array($table, $existingTables)) {
        DB::statement("DROP TABLE IF EXISTS \"$table\" CASCADE");
        echo "Dropped: $table\n";
    }
}

echo "\n=== Done! Now run: php artisan migrate ===\n";
