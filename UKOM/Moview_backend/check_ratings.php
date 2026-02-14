<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Ratings table columns:\n";
$columns = DB::select("SHOW COLUMNS FROM ratings");
foreach ($columns as $col) {
    echo "- {$col->Field} ({$col->Type})\n";
}

echo "\n\nSample rating:\n";
$rating = DB::table('ratings')->first();
print_r($rating);
