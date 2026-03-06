<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

// Check Academy Award films in DB
$films = ['One Battle After Another', 'Sinners', 'Hamnet', 'Marty Supreme', 'The Secret Agent', 'Sentimental Value'];
echo "=== Academy Award nominees in DB ===\n";
foreach ($films as $title) {
    $movie = DB::select("SELECT id, title, default_poster_path FROM movies WHERE title LIKE ? LIMIT 1", ["%{$title}%"]);
    if ($movie) {
        echo "FOUND: id={$movie[0]->id} title={$movie[0]->title} poster=" . ($movie[0]->default_poster_path ? 'yes' : 'no') . "\n";
    } else {
        echo "NOT FOUND: {$title}\n";
    }
}

echo "\n=== Now Showing (is_coming_soon=0) ===\n";
$nowShowing = DB::select("
    SELECT DISTINCT m.id, m.title, m.default_poster_path, ms.release_date, ms.is_coming_soon
    FROM movie_services ms
    JOIN movies m ON ms.movie_id = m.id
    JOIN services s ON ms.service_id = s.id
    WHERE s.type = 'theatrical' AND ms.is_coming_soon = 0
    LIMIT 10
");
foreach ($nowShowing as $r) {
    echo "id={$r->id} {$r->title} release_date=" . ($r->release_date ?? 'NULL') . " poster=" . ($r->default_poster_path ? 'yes' : 'no') . "\n";
}

echo "\n=== Upcoming (is_coming_soon=1) ===\n";
$upcoming = DB::select("
    SELECT DISTINCT m.id, m.title, m.default_poster_path, ms.release_date, ms.is_coming_soon
    FROM movie_services ms
    JOIN movies m ON ms.movie_id = m.id
    JOIN services s ON ms.service_id = s.id
    WHERE s.type = 'theatrical' AND ms.is_coming_soon = 1
    LIMIT 10
");
foreach ($upcoming as $r) {
    echo "id={$r->id} {$r->title} release_date=" . ($r->release_date ?? 'NULL') . " poster=" . ($r->default_poster_path ? 'yes' : 'no') . "\n";
}
