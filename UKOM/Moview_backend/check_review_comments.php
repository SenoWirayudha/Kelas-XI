<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = new PDO(
    'pgsql:host=' . $_ENV['DB_HOST'] . ';port=' . ($_ENV['DB_PORT'] ?? '5432') . ';dbname=' . $_ENV['DB_DATABASE'],
    $_ENV['DB_USERNAME'],
    $_ENV['DB_PASSWORD']
);

echo "=== Checking review_comments table structure ===\n\n";
$stmt = $pdo->query("SELECT column_name AS Field, data_type AS Type FROM information_schema.columns WHERE table_name = 'review_comments' ORDER BY ordinal_position");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['field']} - {$row['type']}\n";
}

echo "\n=== Sample review_comments data ===\n\n";
$stmt = $pdo->query("SELECT * FROM review_comments WHERE id IN (16, 17)");
while ($row = $stmt->fetch(PDO::FETCH_OBJ)) {
    print_r($row);
    echo "\n";
}
