<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== DROPPING CONFLICTING TABLES ===\n\n";

// Drop tables created by migration that conflict with moview_schema.sql
$moviewTables = [
    'movie_services',
    'services',
    'movie_persons',
    'persons',
    'genre_movie',
    'movies',
    'genres'
];

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
foreach ($moviewTables as $table) {
    try {
        DB::statement("DROP TABLE IF EXISTS `$table`");
        echo "Dropped: $table\n";
    } catch (\Exception $e) {
        echo "Skip: $table (doesn't exist)\n";
    }
}
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "\n=== Done! Now import moview_schema.sql ===\n";
echo "Run: Get-Content database\\moview_schema.sql | mysql -u root -p apimoview\n";
