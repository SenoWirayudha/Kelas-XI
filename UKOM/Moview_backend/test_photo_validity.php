<?php

$photoPath = __DIR__ . '/public/storage/profiles/profile_3_1769941056.jpg';

echo "File: $photoPath\n";
echo "Exists: " . (file_exists($photoPath) ? 'YES' : 'NO') . "\n";

if (file_exists($photoPath)) {
    $size = filesize($photoPath);
    echo "Size: " . number_format($size) . " bytes\n";
    
    $imageInfo = @getimagesize($photoPath);
    if ($imageInfo) {
        echo "Valid image: {$imageInfo['mime']}\n";
        echo "Dimensions: {$imageInfo[0]} x {$imageInfo[1]}\n";
    } else {
        echo "INVALID IMAGE!\n";
    }
    
    // Try to create image resource
    $img = @imagecreatefromjpeg($photoPath);
    if ($img) {
        echo "GD can load: YES\n";
        imagedestroy($img);
    } else {
        echo "GD can load: NO (CORRUPT)\n";
    }
}
