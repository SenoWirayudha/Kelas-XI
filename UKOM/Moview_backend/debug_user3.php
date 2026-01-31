<?php

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = new PDO(
    'mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_DATABASE'],
    $_ENV['DB_USERNAME'],
    $_ENV['DB_PASSWORD']
);

echo "=== DEBUG USER ID 3 ===\n\n";

// 1. Cek user data
echo "--- USER DATA ---\n";
$stmt = $pdo->query("SELECT * FROM users WHERE id = 3");
$user = $stmt->fetch(PDO::FETCH_ASSOC);
print_r($user);
echo "\n";

// 2. Cek user_profiles
echo "--- USER PROFILE ---\n";
$stmt = $pdo->query("SELECT * FROM user_profiles WHERE user_id = 3");
$profile = $stmt->fetch(PDO::FETCH_ASSOC);
print_r($profile);
echo "\n";

// 3. Cek favorite films
echo "--- FAVORITE FILMS ---\n";
$stmt = $pdo->query("SELECT * FROM user_favorite_films WHERE user_id = 3 ORDER BY position");
$favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($favorites) . "\n";
print_r($favorites);
echo "\n";

// 4. Cek movie media untuk setiap favorite
if (!empty($favorites)) {
    echo "--- MOVIE MEDIA FOR FAVORITES ---\n";
    foreach ($favorites as $fav) {
        $movieId = $fav['film_id'];
        echo "\nMovie ID: {$movieId}\n";
        
        $stmt = $pdo->query("
            SELECT m.title, mm.media_type, mm.media_path, mm.is_default
            FROM movies m
            LEFT JOIN movie_media mm ON mm.movie_id = m.id
            WHERE m.id = {$movieId}
        ");
        $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($media);
    }
}

// 5. Test API endpoint
echo "\n--- API TEST ---\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/3/profile");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";

// 6. Test favorites endpoint
echo "--- FAVORITES API TEST ---\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/v1/users/3/favorites");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n";

echo "\n=== END DEBUG ===\n";
