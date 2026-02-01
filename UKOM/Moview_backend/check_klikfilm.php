<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Cari service Klikfilm
$klikfilm = DB::table('services')->where('name', 'LIKE', '%Klik%')->first();

if ($klikfilm) {
    echo "Service: {$klikfilm->name} (ID: {$klikfilm->id})\n\n";
    
    // Cari movie yang punya service ini
    $movieServices = DB::table('movie_services')
        ->join('movies', 'movies.id', '=', 'movie_services.movie_id')
        ->where('movie_services.service_id', $klikfilm->id)
        ->select('movies.id', 'movies.title', 'movie_services.*')
        ->limit(5)
        ->get();
    
    echo "Movies with this service:\n";
    echo str_repeat("=", 80) . "\n";
    
    foreach ($movieServices as $ms) {
        echo "Movie: {$ms->title} (ID: {$ms->id})\n";
        echo "  Availability Type: {$ms->availability_type}\n";
        echo "  Release Date: " . ($ms->release_date ?? 'NULL') . "\n";
        echo "  Is Coming Soon: {$ms->is_coming_soon}\n\n";
    }
} else {
    echo "Service Klikfilm tidak ditemukan\n";
    
    // List semua services
    echo "\nAvailable services:\n";
    $services = DB::table('services')->get();
    foreach ($services as $service) {
        echo "  - {$service->name} (ID: {$service->id}, Type: {$service->type})\n";
    }
}
