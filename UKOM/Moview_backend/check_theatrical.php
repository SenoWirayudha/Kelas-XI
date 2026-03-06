<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

echo "=== services columns ===\n";
foreach (DB::select('DESCRIBE services') as $c) echo $c->Field . '(' . $c->Type . ') ';
echo "\n\n=== movie_services columns ===\n";
foreach (DB::select('DESCRIBE movie_services') as $c) echo $c->Field . '(' . $c->Type . ') ';
echo "\n\n=== service types ===\n";
foreach (DB::select('SELECT DISTINCT type FROM services') as $r) echo $r->type . ' ';
echo "\n\n=== theatrical services ===\n";
foreach (DB::select('SELECT id, name, type FROM services WHERE type="theatrical"') as $r) {
    echo "id={$r->id} name={$r->name}\n";
}
echo "\n=== movie_services sample (theatrical) ===\n";
$rows = DB::select('SELECT ms.*, m.title, m.release_year FROM movie_services ms JOIN movies m ON ms.movie_id = m.id JOIN services s ON ms.service_id = s.id WHERE s.type="theatrical" LIMIT 20');
foreach ($rows as $r) {
    echo "{$r->movie_id}|{$r->title}|release_date=" . ($r->release_date ?? 'NULL') . "|is_coming_soon=" . ($r->is_coming_soon ?? 'NULL') . "\n";
}
echo "\n=== movies table - default_poster_path sample ===\n";
foreach (DB::select('SELECT id, title, default_poster_path FROM movies LIMIT 5') as $r) {
    echo "{$r->id}|{$r->title}|{$r->default_poster_path}\n";
}
