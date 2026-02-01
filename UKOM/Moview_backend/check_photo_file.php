<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$profile = DB::table('user_profiles')->where('user_id', 3)->first(['profile_photo']);

echo "Profile photo: " . ($profile ? $profile->profile_photo : 'NULL') . PHP_EOL;

if ($profile && $profile->profile_photo) {
    $path = storage_path('app/public/' . $profile->profile_photo);
    echo "File path: $path" . PHP_EOL;
    echo "File exists: " . (file_exists($path) ? 'YES' : 'NO') . PHP_EOL;
    
    if (file_exists($path)) {
        echo "File size: " . filesize($path) . " bytes" . PHP_EOL;
        echo "MIME type: " . mime_content_type($path) . PHP_EOL;
    }
}
