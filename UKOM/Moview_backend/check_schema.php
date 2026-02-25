<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Users Table Schema ===\n";
$columns = DB::select("DESCRIBE users");
foreach ($columns as $column) {
    echo "{$column->Field} ({$column->Type}) - Null: {$column->Null}, Key: {$column->Key}, Default: {$column->Default}\n";
}

echo "\n=== Sample User Data ===\n";
$sampleUsers = DB::table('users')->select('*')->limit(3)->get();
foreach ($sampleUsers as $user) {
    echo json_encode($user, JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== Reviews Table Schema ===\n";
$reviewCols = DB::select("DESCRIBE reviews");
foreach ($reviewCols as $col) {
    echo "{$col->Field} ({$col->Type})\n";
}

echo "\n=== Review Likes Table Schema ===\n";
$likeCols = DB::select("DESCRIBE review_likes");
foreach ($likeCols as $col) {
    echo "{$col->Field} ({$col->Type})\n";
}

echo "\n=== Sample Review Likes ===\n";
$sampleLikes = DB::table('review_likes')
    ->join('reviews', 'review_likes.review_id', '=', 'reviews.id')
    ->select('review_likes.*', 'reviews.film_id')
    ->limit(5)
    ->get();
foreach ($sampleLikes as $like) {
    echo json_encode($like, JSON_PRETTY_PRINT) . "\n";
}

