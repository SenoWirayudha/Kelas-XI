<?php

echo "Testing API Endpoint\n\n";

$baseUrl = "http://localhost:8000/api/v1";
$currentUserId = 5;
$targetUserId = 3;

$url = "$baseUrl/users/$currentUserId/is-following/$targetUserId";

echo "Testing URL: $url\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo $response . "\n\n";

// Test follow endpoint
echo "\n=== Testing Follow Endpoint ===\n";
$followUrl = "$baseUrl/users/$currentUserId/follow/$targetUserId";
echo "URL: $followUrl\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $followUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HEADER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo $response . "\n";
