<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== movie_media Table Schema ===\n";
$columns = DB::select("DESCRIBE movie_media");
foreach ($columns as $column) {
    echo "{$column->Field} ({$column->Type})\n";
}

echo "\n=== Sample movie_media Data ===\n";
$sampleMedia = DB::table('movie_media')->limit(5)->get();
if ($sampleMedia->count() > 0) {
    foreach ($sampleMedia as $media) {
        echo json_encode($media, JSON_PRETTY_PRINT) . "\n";
    }
} else {
    echo "No data found in movie_media table\n";
}
