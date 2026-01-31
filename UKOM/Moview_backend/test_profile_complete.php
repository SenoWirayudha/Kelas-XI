<?php

echo "=== Testing Profile API ===\n\n";

// Test getUserProfile endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/v1/users/1/profile");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";

if ($response) {
    $data = json_decode($response, true);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";
    
    // Check critical fields
    if (isset($data['success']) && $data['success']) {
        echo "✓ API call successful\n";
        
        if (isset($data['data'])) {
            $profile = $data['data'];
            
            echo "\n--- Profile Info ---\n";
            echo "User ID: " . ($profile['user']['id'] ?? 'MISSING') . "\n";
            echo "Username: " . ($profile['user']['username'] ?? 'MISSING') . "\n";
            echo "Display Name: " . ($profile['profile']['display_name'] ?? 'NULL') . "\n";
            echo "Bio: " . ($profile['profile']['bio'] ?? 'NULL') . "\n";
            echo "Profile Photo URL: " . ($profile['profile']['profile_photo_url'] ?? 'NULL') . "\n";
            echo "Backdrop URL: " . ($profile['profile']['backdrop_url'] ?? 'NULL') . "\n";
            
            echo "\n--- Favorites ---\n";
            if (isset($profile['favorites']) && is_array($profile['favorites'])) {
                echo "Count: " . count($profile['favorites']) . "\n";
                foreach ($profile['favorites'] as $fav) {
                    echo "  - " . $fav['title'] . " (" . $fav['year'] . ")\n";
                    echo "    Poster: " . ($fav['poster_path'] ?? 'NULL') . "\n";
                    echo "    Backdrop: " . ($fav['backdrop_path'] ?? 'NULL') . "\n";
                }
            } else {
                echo "No favorites found\n";
            }
            
            echo "\n--- Statistics ---\n";
            if (isset($profile['statistics'])) {
                $stats = $profile['statistics'];
                echo "Films: " . ($stats['films'] ?? 0) . "\n";
                echo "Diary: " . ($stats['diary'] ?? 0) . "\n";
                echo "Reviews: " . ($stats['reviews'] ?? 0) . "\n";
                echo "Watchlist: " . ($stats['watchlist'] ?? 0) . "\n";
                echo "Likes: " . ($stats['likes'] ?? 0) . "\n";
                echo "Followers: " . ($stats['followers'] ?? 0) . "\n";
                echo "Following: " . ($stats['following'] ?? 0) . "\n";
            }
        } else {
            echo "✗ No data field in response\n";
        }
    } else {
        echo "✗ API call failed\n";
        echo "Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "✗ No response from server\n";
}

echo "\n=== Test Complete ===\n";
