<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== user_profiles table structure ===\n";
$columns = DB::select("SELECT column_name AS \"Field\", data_type AS \"Type\" FROM information_schema.columns WHERE table_name = 'user_profiles' ORDER BY ordinal_position");
foreach ($columns as $col) {
    echo sprintf("- %s (%s)\n", $col->Field, $col->Type);
}

echo "\n=== Sample user_profiles data ===\n";
$profiles = DB::table('user_profiles')->limit(2)->get();
echo json_encode($profiles, JSON_PRETTY_PRINT);
