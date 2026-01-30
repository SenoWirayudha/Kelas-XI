<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Movies: " . DB::table('movies')->count() . "\n";
echo "Genres: " . DB::table('genres')->count() . "\n";
echo "Persons: " . DB::table('persons')->count() . "\n";
