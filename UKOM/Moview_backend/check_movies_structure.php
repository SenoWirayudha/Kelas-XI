<?php
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as DB;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$db = new DB;
$db->addConnection([
    'driver'    => 'mysql',
    'host'      => $_ENV['DB_HOST'],
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'],
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
]);

$db->setAsGlobal();
$db->bootEloquent();

echo "=== Checking movies table structure ===\n\n";
$columns = DB::select("DESCRIBE movies");

foreach ($columns as $column) {
    echo "{$column->Field} - {$column->Type}\n";
}

echo "\n\n=== Sample movie data ===\n\n";
$movie = DB::table('movies')->where('id', 10)->first();
print_r($movie);
