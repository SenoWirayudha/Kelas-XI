<?php

// Test save log (no review text)
$userId = 3;
$movieId = 1;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/v1/users/$userId/movies/$movieId/review");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'rating' => 4,
    'watched_at' => '2026-02-06'
    // No 'review' field - this should save as log only
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo "Response from save log:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
echo "\n\n";

// Check diaries table
require 'vendor/autoload.php';
$db = new PDO('mysql:host=127.0.0.1;dbname=apimoview', 'root', '');

$stmt = $db->prepare("SELECT * FROM diaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 3");
$stmt->execute([$userId]);
$diaries = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Latest diary entries:\n";
echo json_encode($diaries, JSON_PRETTY_PRINT);
echo "\n\n";

// Check reviews table
$stmt = $db->prepare("SELECT * FROM reviews WHERE user_id = ? AND film_id = ?");
$stmt->execute([$userId, $movieId]);
$review = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Review for movie $movieId:\n";
echo json_encode($review, JSON_PRETTY_PRINT);
