<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Populating is_rewatched column in reviews table...\n\n";
    
    // Get all reviews with their linked diary entry
    $reviews = DB::table('reviews')
        ->leftJoin('diaries', 'reviews.id', '=', 'diaries.review_id')
        ->select('reviews.id as review_id', 'diaries.is_rewatched as diary_is_rewatched')
        ->get();
    
    $totalProcessed = 0;
    $totalRewatched = 0;
    $totalFirstWatch = 0;
    $totalNoLinkedDiary = 0;
    
    foreach ($reviews as $review) {
        // If review has linked diary, use diary's is_rewatched value
        // Otherwise, default to 0 (first watch)
        $isRewatched = $review->diary_is_rewatched ?? 0;
        
        DB::table('reviews')
            ->where('id', $review->review_id)
            ->update(['is_rewatched' => $isRewatched ? 1 : 0]);
        
        if ($isRewatched) {
            $totalRewatched++;
        } else {
            $totalFirstWatch++;
        }
        
        if ($review->diary_is_rewatched === null) {
            $totalNoLinkedDiary++;
        }
        
        $totalProcessed++;
    }
    
    echo "✓ Successfully processed $totalProcessed review entries\n";
    echo "✓ Rewatched reviews: $totalRewatched\n";
    echo "✓ First watch reviews: $totalFirstWatch\n";
    echo "✓ Reviews with no linked diary: $totalNoLinkedDiary\n\n";
    
    // Show sample results
    echo "Sample of rewatched reviews:\n";
    echo str_repeat("-", 80) . "\n";
    $rewatchedSamples = DB::table('reviews')
        ->join('movies', 'reviews.film_id', '=', 'movies.id')
        ->where('reviews.is_rewatched', 1)
        ->select('reviews.id', 'movies.title', 'reviews.content', 'reviews.is_rewatched')
        ->limit(5)
        ->get();
    
    foreach ($rewatchedSamples as $sample) {
        $content = strlen($sample->content) > 50 ? substr($sample->content, 0, 47) . '...' : $sample->content;
        echo "Review ID: {$sample->id} | {$sample->title} | IsRewatched: {$sample->is_rewatched}\n";
        echo "  Content: $content\n";
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
