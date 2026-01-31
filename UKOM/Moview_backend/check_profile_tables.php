<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== user_profiles Table Schema ===\n";
try {
    $columns = DB::select("DESCRIBE user_profiles");
    foreach ($columns as $column) {
        echo "{$column->Field} ({$column->Type})\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== user_favorite_films Table Schema ===\n";
try {
    $columns = DB::select("DESCRIBE user_favorite_films");
    foreach ($columns as $column) {
        echo "{$column->Field} ({$column->Type})\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Sample user_profiles Data ===\n";
try {
    $profiles = DB::table('user_profiles')->limit(3)->get();
    foreach ($profiles as $profile) {
        echo "User ID: {$profile->user_id}\n";
        print_r($profile);
        echo "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Sample user_favorite_films Data ===\n";
try {
    $favorites = DB::table('user_favorite_films')
        ->join('movies', 'user_favorite_films.film_id', '=', 'movies.id')
        ->select('user_favorite_films.*', 'movies.title', 'movies.poster_path')
        ->limit(5)
        ->get();
    foreach ($favorites as $fav) {
        echo "User ID: {$fav->user_id}, Movie: {$fav->title}, Position: {$fav->position}\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
