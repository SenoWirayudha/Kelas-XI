<?php

// Test Films API to check is_liked field
$userId = 3;
$url = "http://localhost:8000/api/v1/users/{$userId}/films";

echo "Testing Films API: $url\n";
echo str_repeat("=", 80) . "\n\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n\n";

$data = json_decode($response, true);
if ($data && isset($data['success']) && $data['success']) {
    echo "Success: true\n";
    echo "Number of films: " . count($data['data']) . "\n\n";
    
    foreach ($data['data'] as $film) {
        echo "Film ID: {$film['id']}\n";
        echo "Title: {$film['title']}\n";
        echo "Rating: " . ($film['rating'] ?? 'NULL') . "\n";
        echo "Is Liked: " . ($film['is_liked'] ? 'TRUE' : 'FALSE') . "\n";
        echo str_repeat("-", 40) . "\n";
    }
} else {
    echo "Failed to fetch films\n";
    echo "Response: " . print_r($data, true) . "\n";
}
