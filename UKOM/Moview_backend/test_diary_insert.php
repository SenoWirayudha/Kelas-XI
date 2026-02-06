<?php
require 'vendor/autoload.php';

$db = new PDO('mysql:host=127.0.0.1;dbname=apimoview', 'root', '');

// Insert sample diary entries
$sql = "INSERT INTO diaries (user_id, film_id, watched_at, note, created_at, updated_at) 
        VALUES 
        (3, 1, '2026-02-05', 'Watched this classic movie!', NOW(), NOW()),
        (3, 2, '2026-02-04', 'Beautiful cinematography', NOW(), NOW())";

$db->exec($sql);

echo "Sample diary entries inserted!\n";

// Test the API query
$userId = 3;
$stmt = $db->prepare("
    SELECT 
        diaries.id as diary_id,
        diaries.film_id,
        diaries.watched_at,
        diaries.note,
        diaries.created_at,
        movies.id as movie_id,
        movies.title,
        movies.release_year as year,
        poster_media.media_path as poster_path,
        reviews.id as review_id,
        reviews.rating,
        reviews.content as review_content,
        CASE WHEN reviews.content IS NOT NULL THEN 'review' ELSE 'log' END as type
    FROM diaries
    JOIN movies ON diaries.film_id = movies.id
    LEFT JOIN movie_media as poster_media 
        ON movies.id = poster_media.movie_id 
        AND poster_media.media_type = 'poster'
        AND poster_media.is_default = 1
    LEFT JOIN reviews 
        ON diaries.film_id = reviews.film_id 
        AND reviews.user_id = ?
    WHERE diaries.user_id = ?
    ORDER BY diaries.watched_at DESC, diaries.created_at DESC
");

$stmt->execute([$userId, $userId]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nDiary entries:\n";
echo json_encode($results, JSON_PRETTY_PRINT);
