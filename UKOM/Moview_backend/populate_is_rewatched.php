<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Populating is_rewatched column in diaries table...\n\n";
    
    // Get all users with diaries
    $userFilms = DB::table('diaries')
        ->select('user_id', 'film_id')
        ->groupBy('user_id', 'film_id')
        ->get();
    
    $totalProcessed = 0;
    $totalRewatched = 0;
    
    foreach ($userFilms as $uf) {
        // Get all diary entries for this user-film combination, ordered by created_at
        $diaries = DB::table('diaries')
            ->where('user_id', $uf->user_id)
            ->where('film_id', $uf->film_id)
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
        
        foreach ($diaries as $index => $diary) {
            $isRewatched = $index > 0; // First entry (index 0) = not rewatched
            
            DB::table('diaries')
                ->where('id', $diary->id)
                ->update(['is_rewatched' => $isRewatched ? 1 : 0]);
            
            if ($isRewatched) {
                $totalRewatched++;
            }
            $totalProcessed++;
        }
    }
    
    echo "✓ Successfully processed $totalProcessed diary entries\n";
    echo "✓ Found $totalRewatched rewatch entries\n";
    echo "✓ First watch entries: " . ($totalProcessed - $totalRewatched) . "\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
