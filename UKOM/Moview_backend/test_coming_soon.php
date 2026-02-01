<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Check movie_services table
$services = DB::table('movie_services')
    ->join('services', 'services.id', '=', 'movie_services.service_id')
    ->select('movie_services.*', 'services.name as service_name')
    ->where('movie_id', 1)
    ->get();

echo "Movie Services for Movie ID 1:\n";
echo str_repeat("=", 80) . "\n";

foreach ($services as $service) {
    echo "Service: {$service->service_name}\n";
    echo "  Availability Type: {$service->availability_type}\n";
    echo "  Release Date: " . ($service->release_date ?? 'NULL') . "\n";
    echo "  Is Coming Soon: {$service->is_coming_soon}\n";
    echo "\n";
}

if ($services->isEmpty()) {
    echo "No services found for this movie.\n";
}
