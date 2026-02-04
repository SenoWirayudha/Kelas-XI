<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "CHECKING PROFILE PHOTO FOR USER 3\n";
echo "========================================\n\n";

// Get profile
$profile = DB::table('profiles')->where('user_id', 3)->first();

if (!$profile) {
    echo "Profile for user 3 not found!\n";
    exit;
}

echo "Profile Data:\n";
foreach ($profile as $key => $value) {
    if (strpos($key, 'photo') !== false || strpos($key, 'avatar') !== false || strpos($key, 'image') !== false) {
        echo "- $key: " . ($value ?? 'NULL') . "\n";
        
        if ($value && strpos($key, 'photo') !== false) {
            $fullPath = storage_path('app/public/' . $value);
            echo "  Full Path: $fullPath\n";
            echo "  File Exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
            
            if (file_exists($fullPath)) {
                $fileSize = filesize($fullPath);
                echo "  File Size: " . number_format($fileSize) . " bytes\n";
                
                // Check if valid image
                $imageInfo = @getimagesize($fullPath);
                if ($imageInfo) {
                    echo "  Image Type: {$imageInfo['mime']}\n";
                    echo "  Dimensions: {$imageInfo[0]} x {$imageInfo[1]}\n";
                    echo "  ✅ Valid Image\n";
                } else {
                    echo "  ❌ CORRUPT IMAGE - Deleting...\n";
                    @unlink($fullPath);
                    DB::table('profiles')->where('user_id', 3)->update([$key => null]);
                    echo "  File deleted and database updated\n";
                }
            } else {
                echo "  ⚠️  File missing - Cleaning database...\n";
                DB::table('profiles')->where('user_id', 3)->update([$key => null]);
                echo "  Database updated\n";
            }
        }
    }
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
