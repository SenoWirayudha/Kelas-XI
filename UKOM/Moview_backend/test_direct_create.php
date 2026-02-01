<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Movie;

// Test create MovieService dengan is_coming_soon
$movie = Movie::find(1);

if ($movie) {
    // Delete existing services first
    $movie->movieServices()->delete();
    
    // Create with is_coming_soon = 1
    $result = $movie->movieServices()->create([
        'service_id' => 11, // HBO Max
        'availability_type' => 'stream',
        'release_date' => null,
        'is_coming_soon' => 1,
    ]);
    
    echo "Created MovieService:\n";
    echo "  ID: {$result->id}\n";
    echo "  Service ID: {$result->service_id}\n";
    echo "  Availability Type: {$result->availability_type}\n";
    echo "  Is Coming Soon: {$result->is_coming_soon}\n\n";
    
    // Check in database
    $check = \DB::table('movie_services')->where('movie_id', 1)->first();
    echo "Database Check:\n";
    echo "  Is Coming Soon: {$check->is_coming_soon}\n";
} else {
    echo "Movie not found\n";
}
