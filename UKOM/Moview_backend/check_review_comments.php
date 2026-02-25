<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = new PDO(
    'mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_DATABASE'],
    $_ENV['DB_USERNAME'],
    $_ENV['DB_PASSWORD']
);

echo "=== Checking review_comments table structure ===\n\n";
$stmt = $pdo->query("DESCRIBE review_comments");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['Field']} - {$row['Type']}\n";
}

echo "\n=== Sample review_comments data ===\n\n";
$stmt = $pdo->query("SELECT * FROM review_comments WHERE id IN (16, 17)");
while ($row = $stmt->fetch(PDO::FETCH_OBJ)) {
    print_r($row);
    echo "\n";
}
