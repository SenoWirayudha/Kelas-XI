<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$db   = $_ENV['DB_DATABASE'];
$user = $_ENV['DB_USERNAME'];
$pass = $_ENV['DB_PASSWORD'];

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "=== user_profiles table structure ===\n";
$result = $conn->query("DESCRIBE user_profiles");
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . " | " . $row['Default'] . "\n";
}

echo "\n=== Checking backdrop_enabled column ===\n";
$result = $conn->query("SHOW COLUMNS FROM user_profiles LIKE 'backdrop_enabled'");
if ($result->num_rows > 0) {
    echo "✓ backdrop_enabled column EXISTS\n";
} else {
    echo "✗ backdrop_enabled column NOT FOUND\n";
    echo "\nAdding column...\n";
    $conn->query("ALTER TABLE user_profiles ADD COLUMN backdrop_enabled BOOLEAN DEFAULT FALSE AFTER backdrop_path");
    echo "✓ Column added successfully\n";
}

$conn->close();
