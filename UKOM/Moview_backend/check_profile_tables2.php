<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Tables with 'profile' in name ===\n";
$tables = DB::select('SHOW TABLES');
foreach($tables as $t) {
    $tableName = array_values((array)$t)[0];
    if(stripos($tableName, 'profile') !== false) {
        echo "$tableName\n";
        
        // Show structure
        $cols = DB::select("DESCRIBE $tableName");
        foreach ($cols as $col) {
            echo "  - {$col->Field} ({$col->Type})\n";
        }
        echo "\n";
    }
}
