<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Movies Table Schema ===\n";
$columns = DB::select("DESCRIBE movies");
foreach ($columns as $column) {
    echo "{$column->Field} ({$column->Type})\n";
}

echo "\n=== Sample Movie Data ===\n";
$sampleMovie = DB::table('movies')->first();
if ($sampleMovie) {
    echo json_encode($sampleMovie, JSON_PRETTY_PRINT) . "\n";
}
