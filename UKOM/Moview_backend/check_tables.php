<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "CHECKING DATABASE TABLES\n";
echo "========================\n\n";

$tables = [
    'ratings',
    'diaries',
    'reviews',
    'movie_likes',
    'watchlists',
    'followers',
    'followings'
];

foreach ($tables as $table) {
    try {
        $exists = DB::select("SHOW TABLES LIKE '{$table}'");
        if (!empty($exists)) {
            echo "✓ Table '{$table}' EXISTS\n";
            
            // Get columns
            $columns = DB::select("DESCRIBE {$table}");
            echo "  Columns: ";
            $colNames = array_map(fn($col) => $col->Field, $columns);
            echo implode(', ', $colNames) . "\n";
            
            // Count records
            $count = DB::table($table)->count();
            echo "  Records: {$count}\n";
        } else {
            echo "✗ Table '{$table}' NOT FOUND\n";
        }
        echo "\n";
    } catch (Exception $e) {
        echo "✗ Error checking '{$table}': " . $e->getMessage() . "\n\n";
    }
}
