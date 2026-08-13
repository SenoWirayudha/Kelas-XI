<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Users Table Schema ===\n";
$columns = DB::select("SELECT column_name AS Field, data_type AS Type, is_nullable AS Null, column_default AS Default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
foreach ($columns as $column) {
    echo "{$column->field} ({$column->type}) - Null: {$column->null}, Default: {$column->default}\n";
}

echo "\n=== Sample User Data ===\n";
$sampleUsers = DB::table('users')->select('*')->limit(3)->get();
foreach ($sampleUsers as $user) {
    echo json_encode($user, JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== Reviews Table Schema ===\n";
$reviewCols = DB::select("SELECT column_name AS Field, data_type AS Type FROM information_schema.columns WHERE table_name = 'reviews' ORDER BY ordinal_position");
foreach ($reviewCols as $col) {
    echo "{$col->field} ({$col->type})\n";
}

echo "\n=== Review Likes Table Schema ===\n";
$likeCols = DB::select("SELECT column_name AS Field, data_type AS Type FROM information_schema.columns WHERE table_name = 'review_likes' ORDER BY ordinal_position");
foreach ($likeCols as $col) {
    echo "{$col->field} ({$col->type})\n";
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

