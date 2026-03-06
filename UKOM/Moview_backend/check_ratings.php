<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Ratings table columns:\n";
$columns = DB::select("SHOW COLUMNS FROM ratings");
foreach ($columns as $col) {
    echo "- {$col->Field} ({$col->Type})\n";
}

// Check diary entries with 0 rating for user 3
$diaries = DB::select('SELECT id, film_id, rating, review_id FROM diaries WHERE user_id = 3 AND rating = 0');
echo "\nDiary entries with 0 rating for user 3:\n";
foreach ($diaries as $d) {
    echo "diary_id={$d->id} film_id={$d->film_id} rating={$d->rating} review_id=" . ($d->review_id ?? 'NULL') . "\n";
}

// All diary entries for user 3
$allDiaries = DB::select('SELECT id, film_id, rating, review_id FROM diaries WHERE user_id = 3');
echo "\nAll diary entries for user 3:\n";
foreach ($allDiaries as $d) {
    echo "diary_id={$d->id} film_id={$d->film_id} rating={$d->rating} review_id=" . ($d->review_id ?? 'NULL') . "\n";
}

// Ratings table for user 3
$ratings = DB::select('SELECT * FROM ratings WHERE user_id = 3');
echo "\nUser 3 ratings table:\n";
foreach ($ratings as $r) {
    echo "id={$r->id} film_id={$r->film_id} rating={$r->rating}\n";
}

// User 5 diary entries
$diaries5 = DB::select('SELECT id, film_id, rating, review_id FROM diaries WHERE user_id = 5');
echo "\nAll diary entries for user 5:\n";
foreach ($diaries5 as $d) {
    echo "diary_id={$d->id} film_id={$d->film_id} rating={$d->rating} review_id=" . ($d->review_id ?? 'NULL') . "\n";
}

// User 5 ratings table
$ratings5 = DB::select('SELECT * FROM ratings WHERE user_id = 5');
echo "\nUser 5 ratings table:\n";
foreach ($ratings5 as $r) {
    echo "id={$r->id} film_id={$r->film_id} rating={$r->rating}\n";
};
