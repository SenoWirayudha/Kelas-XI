<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking ratings table structure...\n\n";

try {
    $columns = DB::select("DESCRIBE ratings");
    foreach ($columns as $column) {
        echo $column->Field . " - " . $column->Type . " - " . $column->Null . " - " . $column->Default . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
