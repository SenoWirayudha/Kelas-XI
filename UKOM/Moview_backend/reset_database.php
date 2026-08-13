<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== FULL DATABASE RESET ===\n\n";

// Get all tables
$tables = DB::select("SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
$existingTables = array_map(function($table) {
    return $table->name;
}, $tables);

echo "Dropping all tables except migrations...\n";
foreach ($existingTables as $table) {
    if ($table !== 'migrations') {
        DB::statement("DROP TABLE IF EXISTS \"$table\" CASCADE");
        echo "Dropped: $table\n";
    }
}

// Clear migration records except for essential ones
echo "\nClearing migration records...\n";
DB::table('migrations')->whereNotIn('migration', [
    '0001_01_01_000001_create_cache_table',
    '0001_01_01_000002_create_jobs_table',
])->delete();

echo "\n=== Done! Now run: php artisan migrate --seed ===\n";
