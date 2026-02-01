<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Modifying duration column to be nullable...\n";
    
    DB::statement('ALTER TABLE movies MODIFY COLUMN duration INT NULL');
    
    echo "✓ SUCCESS: Duration column is now nullable\n";
    
    // Verify the change
    $columns = DB::select("SHOW COLUMNS FROM movies LIKE 'duration'");
    if (!empty($columns)) {
        $column = $columns[0];
        echo "\nColumn details:\n";
        echo "  Field: {$column->Field}\n";
        echo "  Type: {$column->Type}\n";
        echo "  Null: {$column->Null}\n";
        echo "  Default: {$column->Default}\n";
    }
    
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
