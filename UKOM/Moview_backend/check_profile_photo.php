<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

echo "========================================\n";
echo "CHECKING PROFILE PHOTOS\n";
echo "========================================\n\n";

// Get user with ID 3
$user = DB::table('users')->where('id', 3)->first();

if (!$user) {
    echo "User 3 not found!\n";
    exit;
}

echo "User: {$user->username}\n";
echo "Profile Photo Path: " . ($user->profile_photo_path ?? 'NULL') . "\n\n";

if ($user->profile_photo_path) {
    $fullPath = storage_path('app/public/' . $user->profile_photo_path);
    
    echo "Full Path: $fullPath\n";
    echo "File Exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($fullPath)) {
        $fileSize = filesize($fullPath);
        echo "File Size: " . number_format($fileSize) . " bytes\n";
        
        // Check if file is valid image
        $imageInfo = @getimagesize($fullPath);
        if ($imageInfo) {
            echo "Image Type: {$imageInfo['mime']}\n";
            echo "Dimensions: {$imageInfo[0]} x {$imageInfo[1]}\n";
            echo "Valid Image: YES\n";
        } else {
            echo "Valid Image: NO (File is corrupt or not an image)\n";
            
            // Try to delete corrupt file
            echo "\nDeleting corrupt file...\n";
            @unlink($fullPath);
            
            // Update database
            DB::table('users')->where('id', 3)->update(['profile_photo_path' => null]);
            echo "Database updated - profile_photo_path set to NULL\n";
        }
    }
} else {
    echo "User has no profile photo.\n";
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
