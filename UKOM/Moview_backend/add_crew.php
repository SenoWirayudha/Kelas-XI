<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Add Screenplay for Resurrection (ID: 3)
$biGan = DB::table('persons')->where('full_name', 'Bi Gan')->first();
if ($biGan && !DB::table('movie_persons')->where('movie_id', 3)->where('job', 'Screenplay')->exists()) {
    DB::table('movie_persons')->insert([
        'movie_id' => 3,
        'person_id' => $biGan->id,
        'role_type' => 'crew',
        'character_name' => null,
        'job' => 'Screenplay',
        'order_index' => 0,
    ]);
    echo "Added Screenplay for Resurrection\n";
}

// Add Screenplay for Past Lives (ID: 5)
$celineSong = DB::table('persons')->where('full_name', 'Celine Song')->first();
if ($celineSong && !DB::table('movie_persons')->where('movie_id', 5)->where('job', 'Screenplay')->exists()) {
    DB::table('movie_persons')->insert([
        'movie_id' => 5,
        'person_id' => $celineSong->id,
        'role_type' => 'crew',
        'character_name' => null,
        'job' => 'Screenplay',
        'order_index' => 0,
    ]);
    echo "Added Screenplay for Past Lives\n";
}

// Add Cinematographer for Hamnet (ID: 7)
if (!DB::table('movie_persons')->where('movie_id', 7)->where('job', 'Cinematographer')->exists()) {
    $dpId = DB::table('persons')->insertGetId([
        'full_name' => 'Joshua James Richards',
        'primary_role' => 'Cinematographer',
        'photo_path' => null,
        'nationality' => 'United Kingdom',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    DB::table('movie_persons')->insert([
        'movie_id' => 7,
        'person_id' => $dpId,
        'role_type' => 'crew',
        'character_name' => null,
        'job' => 'Cinematographer',
        'order_index' => 0,
    ]);
    echo "Added Cinematographer for Hamnet\n";
}

// Add Screenplay for A Useful Ghost (ID: 6)
if (!DB::table('movie_persons')->where('movie_id', 6)->where('job', 'Screenplay')->exists()) {
    $writerId = DB::table('persons')->insertGetId([
        'full_name' => 'Unknown Writer',
        'primary_role' => 'Writer',
        'photo_path' => null,
        'nationality' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    DB::table('movie_persons')->insert([
        'movie_id' => 6,
        'person_id' => $writerId,
        'role_type' => 'crew',
        'character_name' => null,
        'job' => 'Screenplay',
        'order_index' => 0,
    ]);
    echo "Added Screenplay for A Useful Ghost\n";
}

echo "\nDone! Checking all movies now:\n\n";

$movies = DB::table('movies')->select('id', 'title')->get();
foreach ($movies as $movie) {
    $crewCount = DB::table('movie_persons')
        ->where('movie_id', $movie->id)
        ->where('role_type', 'crew')
        ->where('job', '!=', 'Director')
        ->count();
    
    echo "ID: {$movie->id} - {$movie->title} - Non-Director crew: {$crewCount}\n";
}
