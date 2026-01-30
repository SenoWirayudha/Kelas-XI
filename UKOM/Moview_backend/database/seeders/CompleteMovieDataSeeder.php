<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompleteMovieDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update Past Lives (ID: 5) - add more crew
        $pastLivesDirectorId = DB::table('persons')->where('full_name', 'Celine Song')->first();
        if ($pastLivesDirectorId) {
            // Add Celine Song as writer too
            if (!DB::table('movie_persons')->where('movie_id', 5)->where('person_id', $pastLivesDirectorId->id)->where('job', 'Screenplay')->exists()) {
                DB::table('movie_persons')->insert([
                    'movie_id' => 5,
                    'person_id' => $pastLivesDirectorId->id,
                    'role_type' => 'crew',
                    'character_name' => null,
                    'job' => 'Screenplay',
                    'order_index' => 0,
                ]);
            }
        }
        
        // Update Inception (ID: 1)
        $inceptionCrew = DB::table('persons')->whereIn('full_name', ['Christopher Nolan', 'Hoyte van Hoytema'])->pluck('id', 'full_name');
        if ($inceptionCrew->isEmpty()) {
            // Create persons if not exist
            $nolanId = DB::table('persons')->insertGetId([
                'full_name' => 'Christopher Nolan',
                'primary_role' => 'Director',
                'photo_path' => null,
                'nationality' => 'United Kingdom',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $hoyteId = DB::table('persons')->insertGetId([
                'full_name' => 'Hoyte van Hoytema',
                'primary_role' => 'Cinematographer',
                'photo_path' => null,
                'nationality' => 'Sweden',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $nolanId = $inceptionCrew->get('Christopher Nolan');
            $hoyteId = $inceptionCrew->get('Hoyte van Hoytema');
        }
        
        // Add crew if not exist
        if (!DB::table('movie_persons')->where('movie_id', 1)->where('person_id', $nolanId)->where('job', 'Cinematographer')->exists() && $hoyteId) {
            DB::table('movie_persons')->insert([
                'movie_id' => 1,
                'person_id' => $hoyteId,
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Cinematographer',
                'order_index' => 0,
            ]);
        }
        
        DB::table('movies')->where('id', 1)->update([
            'original_language' => 'en',
            'spoken_languages' => json_encode(['English']),
            'production_countries' => json_encode(['United States', 'United Kingdom']),
            'production_companies' => json_encode(['Warner Bros. Pictures', 'Legendary Pictures', 'Syncopy']),
        ]);
        
        // Update Resurrection (ID: 3)
        // Add screenplay writer
        $resWriterId = DB::table('persons')->insertGetId([
            'full_name' => 'Bi Gan',
            'primary_role' => 'Writer',
            'photo_path' => null,
            'nationality' => 'China',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        DB::table('movie_persons')->insert([
            'movie_id' => 3,
            'person_id' => $resWriterId,
            'role_type' => 'crew',
            'character_name' => null,
            'job' => 'Screenplay',
            'order_index' => 0,
        ]);
        
        DB::table('movies')->where('id', 3)->update([
            'original_language' => 'zh',
            'spoken_languages' => json_encode(['Mandarin']),
            'production_countries' => json_encode(['China']),
            'production_companies' => json_encode(['CJ Entertainment']),
        ]);
        
        // Update A Useful Ghost (ID: 6)
        $ghostDirectorId = DB::table('persons')->where('full_name', 'Unknown Director')->first();
        if (!$ghostDirectorId) {
            $ghostDirectorId = DB::table('persons')->insertGetId([
                'full_name' => 'Unknown Director',
                'primary_role' => 'Director',
                'photo_path' => null,
                'nationality' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $ghostDirectorId = $ghostDirectorId->id;
        }
        
        if (!DB::table('movie_persons')->where('movie_id', 6)->where('job', 'Director')->exists()) {
            DB::table('movie_persons')->insert([
                'movie_id' => 6,
                'person_id' => $ghostDirectorId,
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Director',
                'order_index' => 0,
            ]);
        }
        
        // Add writer
        $ghostWriterId = DB::table('persons')->insertGetId([
            'full_name' => 'Unknown Writer',
            'primary_role' => 'Writer',
            'photo_path' => null,
            'nationality' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        DB::table('movie_persons')->insert([
            'movie_id' => 6,
            'person_id' => $ghostWriterId,
            'role_type' => 'crew',
            'character_name' => null,
            'job' => 'Screenplay',
            'order_index' => 0,
        ]);
        
        DB::table('movies')->where('id', 6)->update([
            'original_language' => 'en',
            'spoken_languages' => json_encode(['English']),
            'production_countries' => json_encode(['United States']),
            'production_companies' => json_encode(['Independent']),
        ]);
        
        // Update Hamnet (ID: 7)
        $hamnetDirectorId = DB::table('persons')->where('full_name', 'Chloé Zhao')->first();
        if (!$hamnetDirectorId) {
            $hamnetDirectorId = DB::table('persons')->insertGetId([
                'full_name' => 'Chloé Zhao',
                'primary_role' => 'Director',
                'photo_path' => null,
                'nationality' => 'China',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $hamnetDirectorId = $hamnetDirectorId->id;
        }
        
        if (!DB::table('movie_persons')->where('movie_id', 7)->where('job', 'Director')->exists()) {
            DB::table('movie_persons')->insert([
                'movie_id' => 7,
                'person_id' => $hamnetDirectorId,
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Director',
                'order_index' => 0,
            ]);
        }
        
        // Add cinematographer
        $hamnetDpId = DB::table('persons')->insertGetId([
            'full_name' => 'Joshua James Richards',
            'primary_role' => 'Cinematographer',
            'photo_path' => null,
            'nationality' => 'United Kingdom',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        DB::table('movie_persons')->insert([
            'movie_id' => 7,
            'person_id' => $hamnetDpId,
            'role_type' => 'crew',
            'character_name' => null,
            'job' => 'Cinematographer',
            'order_index' => 0,
        ]);
        
        DB::table('movies')->where('id', 7)->update([
            'original_language' => 'en',
            'spoken_languages' => json_encode(['English']),
            'production_countries' => json_encode(['United Kingdom']),
            'production_companies' => json_encode(['Amblin Partners']),
        ]);
    }
}
