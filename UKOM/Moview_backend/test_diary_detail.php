<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "TESTING DIARY DETAIL ENDPOINT\n";
echo "=============================\n\n";

// Test parameters
$userId = 3;
$diaryId = 14; // Get the first diary entry

echo "Testing with userId={$userId}, diaryId={$diaryId}\n\n";

// Check if diary exists
try {
    $diary = DB::table('diaries')
        ->where('id', $diaryId)
        ->where('user_id', $userId)
        ->first();
    
    if ($diary) {
        echo "✓ Diary entry found\n";
        echo "  Diary ID: {$diary->id}\n";
        echo "  User ID: {$diary->user_id}\n";
        echo "  Film ID: {$diary->film_id}\n";
        echo "  Watched at: {$diary->watched_at}\n\n";
    } else {
        echo "✗ Diary entry NOT found\n\n";
    }
    
    // Try to call the controller method
    $controller = new App\Http\Controllers\Api\V1\UserActivityController();
    $response = $controller->getDiaryDetail($userId, $diaryId);
    
    echo "Controller response:\n";
    echo $response->getContent() . "\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
