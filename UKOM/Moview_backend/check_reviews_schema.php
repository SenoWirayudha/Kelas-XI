<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $result = DB::select('SHOW CREATE TABLE reviews');
    if (!empty($result)) {
        echo $result[0]->{'Create Table'};
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
