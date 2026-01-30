<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$movies = DB::table('movies')->select('id', 'title', 'original_language', 'production_companies')->get();

echo "Total movies: " . $movies->count() . "\n\n";

foreach ($movies as $movie) {
    $crewCount = DB::table('movie_persons')
        ->where('movie_id', $movie->id)
        ->where('role_type', 'crew')
        ->count();
    
    echo "ID: {$movie->id} - {$movie->title}\n";
    echo "  Original Language: " . ($movie->original_language ?? 'NULL') . "\n";
    echo "  Production Companies: " . ($movie->production_companies ?? 'NULL') . "\n";
    echo "  Crew count: {$crewCount}\n\n";
}
