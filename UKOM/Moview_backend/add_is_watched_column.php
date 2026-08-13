<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Adding is_watched column to ratings table...\n\n";

try {
    DB::statement('ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_watched SMALLINT DEFAULT 0');
    echo "✓ Column is_watched added successfully!\n";
    
    // Verify
    $columns = DB::select("SELECT column_name AS \"Field\", data_type AS \"Type\" FROM information_schema.columns WHERE table_name = 'ratings' ORDER BY ordinal_position");
    echo "\nUpdated structure:\n";
    foreach ($columns as $column) {
        echo "  " . $column->Field . " - " . $column->Type . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
