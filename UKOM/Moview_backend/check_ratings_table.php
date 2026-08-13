<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking ratings table structure...\n\n";

try {
    $columns = DB::select("SELECT column_name AS \"Field\", data_type AS \"Type\", is_nullable AS \"Null\", column_default AS \"Default\" FROM information_schema.columns WHERE table_name = 'ratings' ORDER BY ordinal_position");
    foreach ($columns as $column) {
        echo $column->Field . " - " . $column->Type . " - " . $column->Null . " - " . $column->Default . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
