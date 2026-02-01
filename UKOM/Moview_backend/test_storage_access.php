<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$profile = DB::table('user_profiles')->where('user_id', 3)->first(['profile_photo', 'updated_at']);

if ($profile && $profile->profile_photo) {
    $timestamp = $profile->updated_at ? strtotime($profile->updated_at) : time();
    $storageUrl = "http://10.0.2.2:8000/storage/{$profile->profile_photo}?t={$timestamp}";
    
    echo "Profile photo path: {$profile->profile_photo}\n";
    echo "Storage URL: {$storageUrl}\n";
    
    // Check if file exists
    $publicPath = public_path("storage/{$profile->profile_photo}");
    echo "Public path: {$publicPath}\n";
    echo "File exists: " . (file_exists($publicPath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($publicPath)) {
        echo "File size: " . filesize($publicPath) . " bytes\n";
    }
} else {
    echo "No profile photo found\n";
}
