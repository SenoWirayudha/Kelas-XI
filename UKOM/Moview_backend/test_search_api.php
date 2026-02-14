<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Bootstrap Laravel app
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "=== Testing Search API Endpoint ===\n\n";

// Test search types
$searchTests = [
    ['query' => 'the', 'type' => 'all'],
    ['query' => 'christopher', 'type' => 'cast_crew'],
    ['query' => 'warner', 'type' => 'production_houses'],
    ['query' => 'user', 'type' => 'people'],
];

foreach ($searchTests as $test) {
    echo "--- Testing search: q={$test['query']}, type={$test['type']} ---\n";
    
    // Create a proper request with query parameters
    $request = new Illuminate\Http\Request();
    $request->merge($test);
    $request->setMethod('GET');
    
    try {
        $controller = new App\Http\Controllers\Api\MovieApiController();
        $response = $controller->search($request);
        $content = $response->getContent();
        $data = json_decode($content, true);
        
        if ($data['success']) {
            echo "✓ Success!\n";
            if (isset($data['data']['movies'])) {
                echo "  Movies: " . count($data['data']['movies']) . " results\n";
            }
            if (isset($data['data']['cast_crew'])) {
                echo "  Cast & Crew: " . count($data['data']['cast_crew']) . " results\n";
                if (count($data['data']['cast_crew']) > 0) {
                    $first = $data['data']['cast_crew'][0];
                    echo "    First: {$first['name']} ({$first['role']})\n";
                }
            }
            if (isset($data['data']['production_houses'])) {
                echo "  Production Houses: " . count($data['data']['production_houses']) . " results\n";
                if (count($data['data']['production_houses']) > 0) {
                    $first = $data['data']['production_houses'][0];
                    echo "    First: {$first['name']}\n";
                }
            }
            if (isset($data['data']['people'])) {
                echo "  People (Users): " . count($data['data']['people']) . " results\n";
                if (count($data['data']['people']) > 0) {
                    $first = $data['data']['people'][0];
                    echo "    First: {$first['username']} - {$first['full_name']}\n";
                    echo "    Stats: {$first['films_count']} films, {$first['reviews_count']} reviews\n";
                }
            }
        } else {
            echo "✗ Failed: " . ($data['message'] ?? 'Unknown error') . "\n";
        }
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

echo "=== Test completed ===\n";
