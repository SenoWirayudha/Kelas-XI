<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "========================================\n";
echo "CHECKING USERS TABLE STRUCTURE\n";
echo "========================================\n\n";

// Get columns
$columns = DB::select("DESCRIBE users");

echo "Columns in 'users' table:\n";
foreach ($columns as $column) {
    echo "- {$column->Field} ({$column->Type})\n";
}

echo "\n========================================\n";
echo "USER 3 DATA\n";
echo "========================================\n\n";

$user = DB::table('users')->where('id', 3)->first();

if ($user) {
    foreach ($user as $key => $value) {
        if (strpos($key, 'photo') !== false || strpos($key, 'avatar') !== false || strpos($key, 'image') !== false) {
            echo "$key: " . ($value ?? 'NULL') . "\n";
        }
    }
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
