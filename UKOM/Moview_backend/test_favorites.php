<?php

echo "=== Testing Favorites API ===\n\n";

$userId = 1;

// Get favorites
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/{$userId}/favorites");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";

if ($httpCode == 200) {
    $data = json_decode($response, true);
    
    if ($data['success']) {
        echo "✓ API call successful\n\n";
        
        $favorites = $data['data'];
        echo "--- Favorites ({count}) ---\n";
        
        if (empty($favorites)) {
            echo "No favorites found. Let's check if we have any favorite films in database...\n\n";
            
            // Check database directly
            require 'vendor/autoload.php';
            $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
            $dotenv->load();
            
            $pdo = new PDO(
                'mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_DATABASE'],
                $_ENV['DB_USERNAME'],
                $_ENV['DB_PASSWORD']
            );
            
            $stmt = $pdo->query("SELECT * FROM user_favorite_films WHERE user_id = {$userId}");
            $dbFavorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "Database favorites count: " . count($dbFavorites) . "\n";
            
            if (!empty($dbFavorites)) {
                echo "Database favorites:\n";
                print_r($dbFavorites);
            } else {
                echo "Database is empty. This is normal for new users.\n";
            }
        } else {
            foreach ($favorites as $fav) {
                echo "\n";
                echo "ID: " . $fav['id'] . "\n";
                echo "Title: " . $fav['title'] . "\n";
                echo "Year: " . $fav['year'] . "\n";
                echo "Poster: " . ($fav['poster_path'] ?? 'NULL') . "\n";
                echo "Backdrop: " . ($fav['backdrop_path'] ?? 'NULL') . "\n";
                echo "Position: " . $fav['position'] . "\n";
                
                // Check if URLs are full
                if (isset($fav['poster_path']) && str_starts_with($fav['poster_path'], 'http')) {
                    echo "✓ Poster URL is full URL\n";
                } elseif (isset($fav['poster_path'])) {
                    echo "✗ Poster URL is NOT full URL\n";
                }
                
                if (isset($fav['backdrop_path']) && str_starts_with($fav['backdrop_path'], 'http')) {
                    echo "✓ Backdrop URL is full URL\n";
                } elseif (isset($fav['backdrop_path'])) {
                    echo "✗ Backdrop URL is NOT full URL\n";
                }
            }
        }
    } else {
        echo "✗ API returned success=false\n";
    }
} else {
    echo "✗ API call failed\n";
}

echo "\n=== Test Complete ===\n";
