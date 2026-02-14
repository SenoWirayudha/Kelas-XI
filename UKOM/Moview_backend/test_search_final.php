<?php

echo "=== Testing Search Endpoints ===\n\n";

$tests = [
    ['type' => 'cast_crew', 'query' => 'park'],
    ['type' => 'production_houses', 'query' => 'a24'],
    ['type' => 'people', 'query' => 'seng'],
    ['type' => 'all', 'query' => 'park']
];

foreach ($tests as $test) {
    echo "--- Testing {$test['type']} with query '{$test['query']}' ---\n";
    
    $url = "http://127.0.0.1:8000/api/v1/search?q={$test['query']}&type={$test['type']}";
    $response = @file_get_contents($url);
    
    if ($response === false) {
        echo "✗ ERROR: Failed to connect\n\n";
        continue;
    }
    
    $data = json_decode($response, true);
    
    if ($data['success']) {
        echo "✓ Success\n";
        foreach ($data['data'] as $key => $items) {
            $count = count($items);
            if ($count > 0) {
                echo "  {$key}: {$count} results\n";
                echo "    First: " . json_encode($items[0]) . "\n";
            }
        }
    } else {
        echo "✗ Failed: {$data['message']}\n";
    }
    echo "\n";
}
