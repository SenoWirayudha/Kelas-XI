<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$db   = $_ENV['DB_DATABASE'];
$user = $_ENV['DB_USERNAME'];
$pass = $_ENV['DB_PASSWORD'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Checking watchlists table...\n";
    echo str_repeat("=", 80) . "\n\n";
    
    // Check if watchlists table exists
    $result = $pdo->query("SHOW TABLES LIKE 'watchlists'");
    
    if ($result->rowCount() > 0) {
        echo "✓ watchlists table exists\n\n";
        
        // Show structure
        echo "Table structure:\n";
        $columns = $pdo->query("DESCRIBE watchlists");
        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']}) {$column['Key']}\n";
        }
        
        // Count records
        $count = $pdo->query("SELECT COUNT(*) as total FROM watchlists")->fetch();
        echo "\nTotal records: {$count['total']}\n";
        
    } else {
        echo "✗ watchlists table does NOT exist\n\n";
        echo "Creating watchlists table...\n";
        
        $pdo->exec("
            CREATE TABLE watchlists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                film_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_watchlist (user_id, film_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (film_id) REFERENCES movies(id) ON DELETE CASCADE
            )
        ");
        
        echo "✓ watchlists table created successfully\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
