<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Checking is_rewatched column in diaries table...\n\n";
    
    // Get sample diaries with is_rewatched info
    $diaries = DB::table('diaries')
        ->select('id', 'user_id', 'film_id', 'is_rewatched', 'note', 'created_at')
        ->orderBy('user_id')
        ->orderBy('film_id')
        ->orderBy('created_at')
        ->get();
    
    echo "Total diary entries: " . $diaries->count() . "\n";
    echo "First watch (is_rewatched=0): " . $diaries->where('is_rewatched', 0)->count() . "\n";
    echo "Rewatch (is_rewatched=1): " . $diaries->where('is_rewatched', 1)->count() . "\n\n";
    
    echo "Sample data:\n";
    echo str_repeat("-", 100) . "\n";
    printf("%-5s %-8s %-8s %-12s %-40s %-20s\n", "ID", "User", "Film", "IsRewatched", "Note", "Created");
    echo str_repeat("-", 100) . "\n";
    
    foreach ($diaries as $diary) {
        $note = strlen($diary->note) > 40 ? substr($diary->note, 0, 37) . '...' : $diary->note;
        printf(
            "%-5d %-8d %-8d %-12s %-40s %-20s\n", 
            $diary->id, 
            $diary->user_id, 
            $diary->film_id, 
            $diary->is_rewatched ? 'REWATCH' : 'First', 
            $note,
            substr($diary->created_at, 0, 19)
        );
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
