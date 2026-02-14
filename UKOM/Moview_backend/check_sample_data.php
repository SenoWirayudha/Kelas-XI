<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Sample Users:\n";
$users = DB::table('users')->select('username')->limit(10)->get();
foreach ($users as $u) {
    echo "- {$u->username}\n";
}

echo "\nSample Persons (searching for 'park'):\n";
$persons = DB::table('persons')
    ->where('full_name', 'like', '%park%')
    ->limit(10)
    ->get();
foreach ($persons as $p) {
    echo "- {$p->full_name} (ID: {$p->id})\n";
}

echo "\nSample Production Houses:\n";
$houses = DB::table('production_houses')
    ->select('name')
    ->limit(10)
    ->get();
foreach ($houses as $h) {
    echo "- {$h->name}\n";
}
