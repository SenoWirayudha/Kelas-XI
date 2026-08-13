<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$port = $_ENV['DB_PORT'] ?? '5432';
$db   = $_ENV['DB_DATABASE'];
$user = $_ENV['DB_USERNAME'];
$pass = $_ENV['DB_PASSWORD'];

$conn = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== user_profiles table structure ===\n";
$result = $conn->query("SELECT column_name AS Field, data_type AS Type, is_nullable AS \"Null\", column_default AS \"Default\" FROM information_schema.columns WHERE table_name = 'user_profiles' ORDER BY ordinal_position");
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo $row['field'] . " | " . $row['type'] . " | " . $row['Null'] . " | " . $row['Default'] . "\n";
}

echo "\n=== Checking backdrop_enabled column ===\n";
$result = $conn->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'backdrop_enabled'");
if ($result->rowCount() > 0) {
    echo "✓ backdrop_enabled column EXISTS\n";
} else {
    echo "✗ backdrop_enabled column NOT FOUND\n";
    echo "\nAdding column...\n";
    $conn->exec("ALTER TABLE user_profiles ADD COLUMN backdrop_enabled BOOLEAN DEFAULT FALSE");
    echo "✓ Column added successfully\n";
}
