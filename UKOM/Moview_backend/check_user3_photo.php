<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "CHECKING USER 3 PROFILE PHOTO\n";
echo "========================================\n\n";

$profile = DB::table('user_profiles')->where('user_id', 3)->first();

if (!$profile) {
    echo "Profile for user 3 not found!\n";
    exit;
}

echo "User ID: 3\n";
echo "Display Name: " . ($profile->display_name ?? 'NULL') . "\n";
echo "Profile Photo: " . ($profile->profile_photo ?? 'NULL') . "\n";
echo "Backdrop: " . ($profile->backdrop_path ?? 'NULL') . "\n\n";

if ($profile->profile_photo) {
    $fullPath = storage_path('app/public/' . $profile->profile_photo);
    
    echo "Full Path: $fullPath\n";
    echo "File Exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($fullPath)) {
        $fileSize = filesize($fullPath);
        echo "File Size: " . number_format($fileSize) . " bytes (" . round($fileSize / 1024, 2) . " KB)\n";
        
        // Check if file is valid image
        $imageInfo = @getimagesize($fullPath);
        if ($imageInfo) {
            echo "Image Type: {$imageInfo['mime']}\n";
            echo "Dimensions: {$imageInfo[0]} x {$imageInfo[1]}\n";
            echo "Status: ✅ VALID IMAGE\n\n";
            
            // Check file integrity
            $handle = @fopen($fullPath, 'r');
            if ($handle) {
                fclose($handle);
                echo "File Access: ✅ OK\n";
            } else {
                echo "File Access: ❌ CANNOT READ\n";
            }
        } else {
            echo "Status: ❌ CORRUPT IMAGE\n";
            echo "\nOptions:\n";
            echo "1. Delete corrupt file\n";
            echo "2. Keep for debugging\n";
            echo "\nDeleting corrupt file...\n";
            
            @unlink($fullPath);
            DB::table('user_profiles')->where('user_id', 3)->update(['profile_photo' => null]);
            
            echo "✅ File deleted and database cleaned\n";
        }
    } else {
        echo "Status: ⚠️  FILE MISSING\n";
        echo "\nCleaning database...\n";
        DB::table('user_profiles')->where('user_id', 3)->update(['profile_photo' => null]);
        echo "✅ Database updated\n";
    }
} else {
    echo "No profile photo set.\n";
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
