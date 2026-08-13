<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Tables with 'profile' in name ===\n";
$tables = DB::select("SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
foreach($tables as $t) {
    $tableName = $t->name;
    if(stripos($tableName, 'profile') !== false) {
        echo "$tableName\n";
        
        // Show structure
        $cols = DB::select("SELECT column_name AS \"Field\", data_type AS \"Type\" FROM information_schema.columns WHERE table_name = '$tableName' ORDER BY ordinal_position");
        foreach ($cols as $col) {
            echo "  - {$col->Field} ({$col->Type})\n";
        }
        echo "\n";
    }
}
