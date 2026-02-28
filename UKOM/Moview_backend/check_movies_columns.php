<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = Illuminate\Support\Facades\Schema::getColumnListing('movies');

echo "Movies table columns:\n";
echo implode(", ", $columns) . "\n";

// Check if rating_average exists
if (in_array('rating_average', $columns)) {
    echo "\n✓ rating_average column EXISTS\n";
} else {
    echo "\n✗ rating_average column DOES NOT EXIST\n";
    echo "Need to add this column to the database.\n";
}
