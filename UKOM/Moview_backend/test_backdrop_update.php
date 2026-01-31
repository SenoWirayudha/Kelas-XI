<?php

echo "=== Testing Backdrop Update with Full URL ===\n\n";

$userId = 3;
$fullUrl = "http://10.0.2.2:8000/storage/movies/2/backdrop/wZ5rqpI7SuvCMHeXhGH0P3FFTJEBUYYy1QtsKMWI.webp";

echo "Full URL to send: {$fullUrl}\n\n";

// Test API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/{$userId}/profile/backdrop");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['backdrop_path' => $fullUrl]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response: " . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";

if ($httpCode == 200) {
    echo "✓ Update successful!\n\n";
    
    // Verify in database
    require 'vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    
    $pdo = new PDO(
        'mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_DATABASE'],
        $_ENV['DB_USERNAME'],
        $_ENV['DB_PASSWORD']
    );
    
    $stmt = $pdo->query("SELECT backdrop_path FROM user_profiles WHERE user_id = {$userId}");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "--- Database Check ---\n";
    echo "Stored backdrop_path: {$result['backdrop_path']}\n\n";
    
    if (str_starts_with($result['backdrop_path'], 'http')) {
        echo "✗ ERROR: Still contains full URL!\n";
    } else {
        echo "✓ SUCCESS: Stored as relative path!\n";
    }
    
    // Now test getting profile to see if URL is built correctly
    echo "\n--- Profile API Check ---\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/{$userId}/profile");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    echo "backdrop_url from API: {$data['data']['profile']['backdrop_url']}\n\n";
    
    if ($data['data']['profile']['backdrop_url'] === $fullUrl) {
        echo "✓ SUCCESS: API returns correct full URL!\n";
    } else {
        echo "✗ ERROR: URL mismatch!\n";
        echo "Expected: {$fullUrl}\n";
        echo "Got: {$data['data']['profile']['backdrop_url']}\n";
    }
} else {
    echo "✗ Update failed!\n";
}

echo "\n=== Test Complete ===\n";
