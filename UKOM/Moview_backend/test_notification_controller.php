<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Bootstrap Laravel
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing NotificationController::getNotifications() ===\n\n";

$controller = new \App\Http\Controllers\Api\V1\NotificationController();
$response = $controller->getNotifications(3);

echo "Response Status: " . $response->status() . "\n\n";
echo "Response Content:\n";
echo json_encode($response->getData(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
echo "\n";
