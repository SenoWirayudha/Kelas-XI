<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "SEARCHING FOR PROFILE PHOTO\n";
echo "========================================\n\n";

// Get all tables
$tables = DB::select('SHOW TABLES');
$databaseName = DB::getDatabaseName();

echo "Looking for tables with 'profile' in name:\n";
foreach ($tables as $table) {
    $tableName = $table->{"Tables_in_$databaseName"};
    if (stripos($tableName, 'profile') !== false) {
        echo "- $tableName\n";
        
        // Show columns
        $columns = DB::select("DESCRIBE $tableName");
        echo "  Columns: ";
        $cols = [];
        foreach ($columns as $col) {
            $cols[] = $col->Field;
        }
        echo implode(', ', $cols) . "\n";
    }
}

echo "\nLooking for tables with 'user' in name:\n";
foreach ($tables as $table) {
    $tableName = $table->{"Tables_in_$databaseName"};
    if (stripos($tableName, 'user') !== false && stripos($tableName, 'profile') === false) {
        echo "- $tableName\n";
        
        // Show columns with photo/avatar/image
        $columns = DB::select("DESCRIBE $tableName");
        $photoCols = [];
        foreach ($columns as $col) {
            if (stripos($col->Field, 'photo') !== false || 
                stripos($col->Field, 'avatar') !== false || 
                stripos($col->Field, 'image') !== false ||
                stripos($col->Field, 'backdrop') !== false) {
                $photoCols[] = $col->Field;
            }
        }
        if (!empty($photoCols)) {
            echo "  Photo columns: " . implode(', ', $photoCols) . "\n";
        }
    }
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
