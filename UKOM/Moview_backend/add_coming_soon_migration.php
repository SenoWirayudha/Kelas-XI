<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    // Add is_coming_soon column
    DB::statement("ALTER TABLE movie_services ADD COLUMN is_coming_soon TINYINT(1) DEFAULT 0 COMMENT 'Whether this service is marked as coming soon' AFTER release_date");
    echo "✓ Added is_coming_soon column\n";
    
    // Add index
    DB::statement("CREATE INDEX idx_coming_soon ON movie_services(is_coming_soon)");
    echo "✓ Added index for is_coming_soon\n";
    
    echo "\nMigration completed successfully!\n";
} catch (\Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists, skipping...\n";
    } elseif (strpos($e->getMessage(), 'Duplicate key name') !== false) {
        echo "Index already exists, skipping...\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
