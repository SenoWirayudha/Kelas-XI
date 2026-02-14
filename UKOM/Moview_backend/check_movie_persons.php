<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "movie_persons table columns:\n";
$columns = DB::select("SHOW COLUMNS FROM movie_persons");
foreach ($columns as $col) {
    echo "- {$col->Field} ({$col->Type})\n";
}

echo "\n\nSample movie_persons record:\n";
$record = DB::table('movie_persons')->first();
print_r($record);
