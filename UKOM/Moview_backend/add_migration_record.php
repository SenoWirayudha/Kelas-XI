<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== ADDING MIGRATION RECORD FOR MOVIEW SCHEMA ===\n\n";

// Add fake migration record so Laravel knows moview_schema has been run
$migrationName = '2026_01_27_000001_create_moview_schema_tables';

$exists = DB::table('migrations')->where('migration', $migrationName)->exists();

if (!$exists) {
    DB::table('migrations')->insert([
        'migration' => $migrationName,
        'batch' => 1
    ]);
    echo "✓ Added migration record: $migrationName\n";
} else {
    echo "Already exists: $migrationName\n";
}

echo "\n=== Current Migrations ===\n";
$migrations = DB::table('migrations')->orderBy('id')->get();
foreach ($migrations as $migration) {
    echo "  [{$migration->batch}] {$migration->migration}\n";
}
