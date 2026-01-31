<?php

echo "=== Testing Update Profile API ===\n\n";

// Test data
$userId = 1;
$updateData = [
    'username' => 'NewUsername',
    'bio' => 'This is my new bio',
    'backdrop_enabled' => true
];

// Initialize cURL
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/{$userId}/profile");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

// Execute
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";

if ($httpCode == 200) {
    echo "✓ Update successful\n\n";
    
    // Now get profile to verify
    echo "=== Verifying Update ===\n\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/{$userId}/profile");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Username: " . $data['data']['user']['username'] . "\n";
    echo "Display Name: " . $data['data']['profile']['display_name'] . "\n";
    echo "Bio: " . $data['data']['profile']['bio'] . "\n";
    echo "Backdrop Enabled: " . ($data['data']['profile']['backdrop_enabled'] ? 'true' : 'false') . "\n\n";
    
    if ($data['data']['user']['username'] === 'NewUsername' && 
        $data['data']['profile']['display_name'] === 'NewUsername') {
        echo "✓ display_name updated correctly!\n";
    } else {
        echo "✗ display_name NOT updated!\n";
    }
} else {
    echo "✗ Update failed\n";
}

echo "\n=== Test Complete ===\n";
