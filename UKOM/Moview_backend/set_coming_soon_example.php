<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Update movie ID 14 (Perfect Days) - Klikfilm stream to Coming Soon
$updated = DB::table('movie_services')
    ->where('movie_id', 14)
    ->where('service_id', 11) // Klikfilm
    ->where('availability_type', 'stream')
    ->update(['is_coming_soon' => 1]);

echo "Updated $updated record(s)\n\n";

// Verify
$check = DB::table('movie_services')
    ->join('movies', 'movies.id', '=', 'movie_services.movie_id')
    ->join('services', 'services.id', '=', 'movie_services.service_id')
    ->where('movie_services.movie_id', 14)
    ->where('movie_services.service_id', 11)
    ->select('movies.title', 'services.name as service_name', 'movie_services.*')
    ->first();

if ($check) {
    echo "Verification:\n";
    echo "Movie: {$check->title}\n";
    echo "Service: {$check->service_name}\n";
    echo "Availability Type: {$check->availability_type}\n";
    echo "Is Coming Soon: {$check->is_coming_soon}\n";
} else {
    echo "Record not found\n";
}
