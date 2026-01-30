<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$crew = DB::table('movie_persons')
    ->where('movie_id', 3)
    ->where('role_type', 'crew')
    ->join('persons', 'persons.id', '=', 'movie_persons.person_id')
    ->select('persons.full_name', 'movie_persons.job')
    ->get();

echo "Resurrection crew:\n";
foreach ($crew as $member) {
    echo "  {$member->job}: {$member->full_name}\n";
}
