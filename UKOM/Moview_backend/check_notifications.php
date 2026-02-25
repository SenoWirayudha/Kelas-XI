<?php
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as DB;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$db = new DB;
$db->addConnection([
    'driver'    => 'mysql',
    'host'      => $_ENV['DB_HOST'],
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'],
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
]);

$db->setAsGlobal();
$db->bootEloquent();

echo "=== Checking NOTIFICATIONS Table ===\n\n";
$notifications = DB::table('notifications')
    ->orderBy('id', 'desc')
    ->get();

echo "Total notifications: " . $notifications->count() . "\n\n";

foreach ($notifications as $notif) {
    echo "ID: {$notif->id}\n";
    echo "User ID (receiver): {$notif->user_id}\n";
    echo "Actor ID (performer): {$notif->actor_id}\n";
    echo "Type: {$notif->type}\n";
    echo "Message: {$notif->message}\n";
    echo "Film ID: {$notif->film_id}\n";
    echo "Related ID: {$notif->related_id}\n";
    echo "Is Read: {$notif->is_read}\n";
    echo "Created: {$notif->created_at}\n";
    echo "---\n\n";
}

echo "\n=== Checking USER_ACTIVITIES Table ===\n\n";
$activities = DB::table('user_activities')
    ->orderBy('id', 'desc')
    ->get();

echo "Total activities: " . $activities->count() . "\n\n";

foreach ($activities as $activity) {
    echo "ID: {$activity->id}\n";
    echo "User ID (performer): {$activity->user_id}\n";
    echo "Type: {$activity->type}\n";
    echo "Film ID: {$activity->film_id}\n";
    echo "Meta: {$activity->meta}\n";
    echo "Created: {$activity->created_at}\n";
    echo "---\n\n";
}

echo "\n=== Notifications for User 3 ===\n\n";
$user3Notifs = DB::table('notifications')
    ->where('user_id', 3)
    ->orderBy('created_at', 'desc')
    ->get();

echo "Total notifications for user 3: " . $user3Notifs->count() . "\n\n";

foreach ($user3Notifs as $notif) {
    echo "ID: {$notif->id}\n";
    echo "Actor ID: {$notif->actor_id}\n";
    echo "Type: {$notif->type}\n";
    echo "Message: {$notif->message}\n";
    echo "Is Read: {$notif->is_read}\n";
    echo "Created: {$notif->created_at}\n";
    echo "---\n\n";
}
