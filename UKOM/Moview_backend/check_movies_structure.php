<?php
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as DB;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$db = new DB;
$db->addConnection([
    'driver'    => 'pgsql',
    'host'      => $_ENV['DB_HOST'],
    'port'      => $_ENV['DB_PORT'] ?? '5432',
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'],
    'charset'   => 'utf8',
    'prefix'    => '',
]);

$db->setAsGlobal();
$db->bootEloquent();

echo "=== Checking movies table structure ===\n\n";
$columns = DB::select("SELECT column_name AS \"Field\", data_type AS \"Type\" FROM information_schema.columns WHERE table_name = 'movies' ORDER BY ordinal_position");

foreach ($columns as $column) {
    echo "{$column->Field} - {$column->Type}\n";
}

echo "\n\n=== Sample movie data ===\n\n";
$movie = DB::table('movies')->where('id', 10)->first();
print_r($movie);
