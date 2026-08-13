<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Modifying duration column to be nullable...\n";
    
    DB::statement('ALTER TABLE movies ALTER COLUMN duration DROP NOT NULL');
    
    echo "✓ SUCCESS: Duration column is now nullable\n";
    
    // Verify the change
    $columns = DB::select("SELECT column_name AS \"Field\", data_type AS \"Type\", is_nullable AS \"Null\", column_default AS \"Default\" FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'duration'");
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
