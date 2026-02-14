<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking production_houses table:\n";
$houses = DB::table('production_houses')->limit(5)->get();
echo json_encode($houses, JSON_PRETTY_PRINT) . "\n\n";

echo "Testing search query:\n";
$result = DB::table('production_houses')
    ->where('name', 'like', "%A24%")
    ->get();
echo json_encode($result, JSON_PRETTY_PRINT) . "\n";
