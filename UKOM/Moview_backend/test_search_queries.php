<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel app
$app = require_once __DIR__ . '/bootstrap/app.php';

echo "=== Testing Search Queries ===\n\n";

// Test 1: Search movies
echo "--- Test 1: Search Movies (query: 'the') ---\n";
try {
    $movies = DB::table('movies')
        ->where(function ($q) {
            $query = 'the';
            $q->where('title', 'like', "%{$query}%")
              ->orWhere('synopsis', 'like', "%{$query}%");
        })
        ->where('status', 'published')
        ->limit(5)
        ->get(['id', 'title', 'release_year']);
    
    echo "Found " . $movies->count() . " movies\n";
    foreach ($movies as $movie) {
        echo "  - {$movie->title} ({$movie->release_year})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 2: Search persons
echo "--- Test 2: Search Cast & Crew (query: 'chris') ---\n";
try {
    $persons = DB::table('persons')
        ->where('full_name', 'like', '%chris%')
        ->limit(5)
        ->get(['id', 'full_name', 'primary_role']);
    
    echo "Found " . $persons->count() . " persons\n";
    foreach ($persons as $person) {
        echo "  - {$person->full_name} ({$person->primary_role})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: Search production houses
echo "--- Test 3: Search Production Houses (query: 'warner') ---\n";
try {
    $houses = DB::table('production_houses')
        ->where('name', 'like', '%warner%')
        ->limit(5)
        ->get(['id', 'name']);
    
    echo "Found " . $houses->count() . " production houses\n";
    foreach ($houses as $house) {
        echo "  - {$house->name}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Search users
echo "--- Test 4: Search Users (query: 'user') ---\n";
try {
    $users = DB::table('users')
        ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
        ->where(function ($q) {
            $query = 'user';
            $q->where('users.username', 'like', "%{$query}%")
              ->orWhere('profiles.first_name', 'like', "%{$query}%")
              ->orWhere('profiles.last_name', 'like', "%{$query}%");
        })
        ->select('users.id', 'users.username', 'profiles.first_name', 'profiles.last_name')
        ->limit(5)
        ->get();
    
    echo "Found " . $users->count() . " users\n";
    foreach ($users as $user) {
        $fullName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
        echo "  - {$user->username} ({$fullName})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== All tests completed ===\n";
